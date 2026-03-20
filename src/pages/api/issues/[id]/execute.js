import { db, Issue, Project, Log, Report, SelectedModel, Model, eq } from 'astro:db';
import {
  runGeminiRequest,
  isGeminiRunning,
} from '../../../../lib/gemini-service.js';
import {
  runOpencodeRequest,
  isOpencodeRunning,
} from '../../../../lib/opencode-service.js';

const filePatterns = [
  /Successfully modified file: ([^\s\n`]+)/g,
  /Successfully created file: ([^\s\n`]+)/g,
  /Modified: ([^\s\n`]+)/g,
  /Created: ([^\s\n`]+)/g,
  /wrote ([^\s\n`]+)/g,
  /updated ([^\s\n`]+)/g,
  /deleted ([^\s\n`]+)/g,
  /Renamed ([^\s\n`]+) to ([^\s\n`]+)/g,
  /`([^`]+\.[a-z0-9]+)`/gi,
];

function extractFiles(result) {
  const filesChanged = [];
  for (const pattern of filePatterns) {
    let match;
    while ((match = pattern.exec(result)) !== null) {
      if (match[1]) filesChanged.push(match[1].replace(/^`|`$/g, ''));
      if (match[2]) filesChanged.push(match[2].replace(/^`|`$/g, ''));
    }
  }
  return [...new Set(filesChanged)].filter(f =>
    f.includes('.') &&
    !f.includes(' ') &&
    f.length > 2 &&
    !f.startsWith('http'),
  );
}

function extractFilesOpencode(result) {
  const filesChanged = [];
  const opencodePatterns = [
    /Edit (.*?):/g,
    /Created (.*?):/g,
    /`([^`]+\.[a-z0-9]+)`/gi,
  ];
  for (const pattern of opencodePatterns) {
    let match;
    while ((match = pattern.exec(result)) !== null) {
      if (match[1]) filesChanged.push(match[1].trim());
    }
  }
  return [...new Set(filesChanged)].filter(f =>
    f.includes('.') &&
    !f.includes(' ') &&
    f.length > 2 &&
    !f.startsWith('http'),
  );
}

export const POST = async ({ params }) => {
  const { id } = params;
  if (!id) {
    return new Response(JSON.stringify({ error: 'Issue ID is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const issue = await db.select().from(Issue).where(eq(Issue.id, id)).get();
    if (!issue) {
      return new Response(JSON.stringify({ error: 'Issue not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const project = await db
      .select()
      .from(Project)
      .where(eq(Project.id, issue.project_id))
      .get();
    if (!project) {
      return new Response(JSON.stringify({ error: 'Project not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const selectedModel = await db.select().from(SelectedModel).where(eq(SelectedModel.id, 'default')).get();
    
    // Only use gemini CLI if provider is explicitly 'gemini'
    const provider = selectedModel?.provider === 'gemini' ? 'gemini' : 'opencode';
    const isBusy = isGeminiRunning() || isOpencodeRunning();
    const targetStatus = isBusy ? 'queued' : 'executing';
    const modelId = selectedModel?.model_id || null;

    await db
      .update(Issue)
      .set({ 
        status: targetStatus, 
        provider: provider,
        model: modelId,
        updated_at: new Date() 
      })
      .where(eq(Issue.id, id));

    const providerName = provider === 'opencode' ? 'Opencode CLI' : 'Gemini CLI';

    await db.insert(Log).values({
      id: crypto.randomUUID(),
      issue_id: id,
      action: isBusy ? 'Execution Queued' : 'Execution Start',
      summary: isBusy 
        ? `${providerName} execution added to queue (another process is running)` 
        : `${providerName} execution started`,
      created_at: new Date(),
    });

    let prompt = `${issue.title}: ${issue.description}`;
    if (issue.attachments && Array.isArray(issue.attachments) && issue.attachments.length > 0) {
      prompt += `\n\nAttachments found in .gemini/attachments/${id}/: ${issue.attachments.join(', ')}`;
    }

    let actualStartTime = null;

    if (provider === 'opencode') {
      runOpencodeRequest(prompt, project.directory, {
        onStart: async (pid) => {
          actualStartTime = new Date();
          await db
            .update(Issue)
            .set({ 
              status: 'executing', 
              updated_at: actualStartTime 
            })
            .where(eq(Issue.id, id));
          await db.insert(Log).values({
            id: crypto.randomUUID(),
            issue_id: id,
            action: 'Execution Running',
            summary: `Opencode CLI (PID: ${pid}) is now processing this issue`,
            created_at: actualStartTime,
          });
        },
      }, modelId)
        .then(async (result) => {
          const duration = actualStartTime ? Math.floor((new Date() - actualStartTime) / 1000) : 0;
          const durationStr = duration < 60 ? `${duration}s` : `${Math.floor(duration / 60)}m ${duration % 60}s`;
          
          const cleanResult = result.replace(/\x1B\[[0-9;]*[JKmsu]/g, '');
          const uniqueFiles = extractFilesOpencode(cleanResult);

          console.log(`Extracted ${uniqueFiles.length} files from Opencode execution result for issue ${id}`);

          const reportId = crypto.randomUUID();
          await db.insert(Report).values({
            id: reportId,
            issue_id: id,
            summary: 'Opencode CLI execution result',
            details: result,
            files_changed: uniqueFiles,
            created_at: new Date(),
          });

          await db
            .update(Issue)
            .set({ status: 'testing', updated_at: new Date() })
            .where(eq(Issue.id, id));

          await db.insert(Log).values({
            id: crypto.randomUUID(),
            issue_id: id,
            action: 'Execution Complete',
            summary: `Opencode CLI finished execution in ${durationStr}. Moved to testing.`,
            created_at: new Date(),
          });
        })
        .catch(async (error) => {
          console.error(`Opencode execution failed for issue ${id}:`, error);

          await db.insert(Log).values({
            id: crypto.randomUUID(),
            issue_id: id,
            action: 'Execution Error',
            summary: `Opencode execution failed: ${error.message}`,
            created_at: new Date(),
          });

          await db
            .update(Issue)
            .set({ status: 'todo', updated_at: new Date() })
            .where(eq(Issue.id, id));
        });
    } else {
      const escapedPrompt = prompt.replace(/"/g, '\\"');
      const args = ['fix', `"${escapedPrompt}"`];

      runGeminiRequest(args, project.directory, {
        onStart: async (pid) => {
          actualStartTime = new Date();
          await db
            .update(Issue)
            .set({ 
              status: 'executing', 
              updated_at: actualStartTime 
            })
            .where(eq(Issue.id, id));
          await db.insert(Log).values({
            id: crypto.randomUUID(),
            issue_id: id,
            action: 'Execution Running',
            summary: `Gemini CLI (PID: ${pid}) is now processing this issue`,
            created_at: actualStartTime,
          });
        },
      }, modelId)
        .then(async (result) => {
          const duration = actualStartTime ? Math.floor((new Date() - actualStartTime) / 1000) : 0;
          const durationStr = duration < 60 ? `${duration}s` : `${Math.floor(duration / 60)}m ${duration % 60}s`;

          const cleanResult = result.replace(/\x1B\[[0-9;]*[JKmsu]/g, '');
          const uniqueFiles = extractFiles(cleanResult);

          console.log(`Extracted ${uniqueFiles.length} files from Gemini execution result for issue ${id}`);

          const reportId = crypto.randomUUID();
          await db.insert(Report).values({
            id: reportId,
            issue_id: id,
            summary: 'Gemini CLI execution result',
            details: result,
            files_changed: uniqueFiles,
            created_at: new Date(),
          });

          await db
            .update(Issue)
            .set({ status: 'testing', updated_at: new Date() })
            .where(eq(Issue.id, id));

          await db.insert(Log).values({
            id: crypto.randomUUID(),
            issue_id: id,
            action: 'Execution Complete',
            summary: `Gemini CLI finished execution in ${durationStr}. Moved to testing.`,
            created_at: new Date(),
          });
        })
        .catch(async (error) => {
          console.error(`Gemini execution failed for issue ${id}:`, error);

          await db.insert(Log).values({
            id: crypto.randomUUID(),
            issue_id: id,
            action: 'Execution Error',
            summary: `Gemini execution failed: ${error.message}`,
            created_at: new Date(),
          });

          await db
            .update(Issue)
            .set({ status: 'todo', updated_at: new Date() })
            .where(eq(Issue.id, id));
        });
    }

    return new Response(JSON.stringify({ status: targetStatus }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify({ error: 'Failed to start execution' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
};
