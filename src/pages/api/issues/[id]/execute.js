import { db, Issue, Project, Log, Report, eq } from 'astro:db';
import {
  runGeminiRequest,
  isGeminiRunning,
} from '../../../../lib/gemini-service.js';

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

    const currentRunning = isGeminiRunning();
    const targetStatus = currentRunning ? 'queued' : 'executing';

    // Update issue status
    await db
      .update(Issue)
      .set({ status: targetStatus, updated_at: new Date() })
      .where(eq(Issue.id, id));

    // Log the change
    await db.insert(Log).values({
      id: crypto.randomUUID(),
      issue_id: id,
      action: 'Execution Start',
      summary: currentRunning
        ? 'Issue added to Gemini CLI queue'
        : 'Gemini CLI execution started',
      created_at: new Date(),
    });

    // Start background process
    // args: [command_name, "issue title and description"]
    const args = ['fix', `"${issue.title}: ${issue.description}"`];

    // We don't await the promise here, we want the API to return quickly
    runGeminiRequest(args, project.directory, {
      onStart: async () => {
        // Update database to 'executing' when it actually starts
        await db
          .update(Issue)
          .set({ status: 'executing', updated_at: new Date() })
          .where(eq(Issue.id, id));
        await db.insert(Log).values({
          id: crypto.randomUUID(),
          issue_id: id,
          action: 'Execution Running',
          summary: 'Gemini CLI is now processing this issue',
          created_at: new Date(),
        });
      },
    })
      .then(async (result) => {
        // Strip ANSI escape codes
        const cleanResult = result.replace(/\x1B\[[0-9;]*[JKmsu]/g, '');
        
        // Extract affected files from result
        const filesChanged = [];
        const filePatterns = [
            /Successfully modified file: ([^\s\n`]+)/g,
            /Successfully created file: ([^\s\n`]+)/g,
            /Modified: ([^\s\n`]+)/g,
            /Created: ([^\s\n`]+)/g,
            /wrote ([^\s\n`]+)/g,
            /updated ([^\s\n`]+)/g,
            /deleted ([^\s\n`]+)/g,
            /Renamed ([^\s\n`]+) to ([^\s\n`]+)/g,
            /`([^`]+\.[a-z0-9]+)`/gi // Any file-like string in backticks
        ];

        for (const pattern of filePatterns) {
            let match;
            while ((match = pattern.exec(cleanResult)) !== null) {
                if (match[1]) filesChanged.push(match[1].replace(/^`|`$/g, ''));
                if (match[2]) filesChanged.push(match[2].replace(/^`|`$/g, ''));
            }
        }

        // De-duplicate and filter out obviously non-file matches
        const uniqueFiles = [...new Set(filesChanged)].filter(f => 
            f.includes('.') && 
            !f.includes(' ') && 
            f.length > 2 &&
            !f.startsWith('http')
        );

        console.log(`Extracted ${uniqueFiles.length} files from execution result for issue ${id}`);

        // Save result as Report
        const reportId = crypto.randomUUID();
        await db.insert(Report).values({
          id: reportId,
          issue_id: id,
          summary: 'Gemini CLI execution result',
          details: result,
          files_changed: uniqueFiles,
          created_at: new Date(),
        });

        // Update issue status to testing
        await db
          .update(Issue)
          .set({ status: 'testing', updated_at: new Date() })
          .where(eq(Issue.id, id));

        // Log the completion
        await db.insert(Log).values({
          id: crypto.randomUUID(),
          issue_id: id,
          action: 'Execution Complete',
          summary: 'Gemini CLI finished execution. Moved to testing.',
          created_at: new Date(),
        });
      })
      .catch(async (error) => {
        console.error(`Gemini execution failed for issue ${id}:`, error);

        // Log the failure
        await db.insert(Log).values({
          id: crypto.randomUUID(),
          issue_id: id,
          action: 'Execution Error',
          summary: `Gemini execution failed: ${error.message}`,
          created_at: new Date(),
        });

        // Move back to todo or something?
        await db
          .update(Issue)
          .set({ status: 'todo', updated_at: new Date() })
          .where(eq(Issue.id, id));
      });

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
