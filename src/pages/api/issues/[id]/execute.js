import { IssueService } from '../../../../lib/services/issue-service.js';
import { ProjectService } from '../../../../lib/services/project-service.js';
import { LogService } from '../../../../lib/services/log-service.js';
import { ReportService } from '../../../../lib/services/report-service.js';
import { SettingsService } from '../../../../lib/services/settings-service.js';
import { getGitStatus } from '../../../../lib/git-service.js';
import {
  runGeminiRequest,
  isGeminiRunning,
} from '../../../../lib/gemini-service.js';
import {
  runOpencodeRequest,
  isOpencodeRunning,
} from '../../../../lib/opencode-service.js';

export const POST = async ({ params }) => {
  const { id } = params;
  if (!id) {
    return new Response(JSON.stringify({ error: 'Issue ID is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const issue = await IssueService.getById(id);
    if (!issue) {
      return new Response(JSON.stringify({ error: 'Issue not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const project = await ProjectService.getById(issue.project_id);
    if (!project) {
      return new Response(JSON.stringify({ error: 'Project not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const selectedModel = await SettingsService.getSelectedModel();

    const provider =
      selectedModel?.provider === 'gemini' ? 'gemini' : 'opencode';
    const modelId = selectedModel?.model_id || null;

    let isGemini = isGeminiRunning();
    let isOpencode = isOpencodeRunning();
    let isBusy = isGemini || isOpencode;
    let targetStatus = isBusy ? 'queued' : 'executing';

    if (targetStatus === 'executing') {
      const queuedIssues = await IssueService.getByStatus(
        issue.project_id,
        'testing',
      );

      if (queuedIssues.length) {
        isBusy = true;
        targetStatus = 'queued';
      } else {
        targetStatus = 'executing';
      }
    }

    await IssueService.update(id, {
      status: targetStatus,
      provider: provider,
      model: modelId,
    });

    const providerName =
      provider === 'opencode' ? 'Opencode CLI' : 'Gemini CLI';

    await LogService.create(
      id,
      isBusy ? 'Execution Queued' : 'Execution Start',
      isBusy
        ? `${providerName} execution added to queue (another process is running)`
        : `${providerName} execution started`,
    );

    let prompt = `${issue.title}: ${issue.description}`;
    if (
      issue.attachments &&
      Array.isArray(issue.attachments) &&
      issue.attachments.length > 0
    ) {
      prompt += `\n\nAttachments found in .gemini/attachments/${id}/: ${issue.attachments.join(', ')}`;
    }

    let actualStartTime = null;

    if (isBusy) {
      return new Response(JSON.stringify({ status: targetStatus }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (provider === 'opencode') {
      runOpencodeRequest(
        prompt,
        project.directory,
        {
          onStart: async (pid) => {
            actualStartTime = new Date();
            await IssueService.updateStatus(id, 'executing', {
              updated_at: actualStartTime,
            });
            await LogService.create(
              id,
              'Execution Running',
              `Opencode CLI (PID: ${pid}) is now processing this issue`,
            );
          },
        },
        modelId,
      )
        .then(async (result) => {
          const durationSecs = actualStartTime
            ? Math.floor((new Date() - actualStartTime) / 1000)
            : 0;
          const durationStr =
            durationSecs < 60
              ? `${durationSecs}s`
              : `${Math.floor(durationSecs / 60)}m ${durationSecs % 60}s`;

          const uniqueFiles = await getGitStatus(project.directory);

          await ReportService.create(id, {
            summary: 'Opencode CLI execution result',
            details: result,
            files_changed: uniqueFiles,
            duration: durationSecs,
          });

          await IssueService.updateStatus(id, 'testing');
          await LogService.create(
            id,
            'Execution Complete',
            `Opencode CLI finished execution in ${durationStr}. Moved to testing.`,
          );
        })
        .catch(async (error) => {
          console.error(`Opencode execution failed for issue ${id}:`, error);
          await LogService.create(
            id,
            'Execution Error',
            `Opencode execution failed: ${error.message}`,
          );
          await IssueService.updateStatus(id, 'todo');
        });
    } else {
      const args = ['--prompt', prompt];

      runGeminiRequest(
        args,
        project.directory,
        {
          onStart: async (pid) => {
            actualStartTime = new Date();
            await IssueService.updateStatus(id, 'executing', {
              updated_at: actualStartTime,
            });
            await LogService.create(
              id,
              'Execution Running',
              `Gemini CLI (PID: ${pid}) is now processing this issue`,
            );
          },
        },
        modelId,
      )
        .then(async (result) => {
          const durationSecs = actualStartTime
            ? Math.floor((new Date() - actualStartTime) / 1000)
            : 0;
          const durationStr =
            durationSecs < 60
              ? `${durationSecs}s`
              : `${Math.floor(durationSecs / 60)}m ${durationSecs % 60}s`;

          const uniqueFiles = await getGitStatus(project.directory);

          await ReportService.create(id, {
            summary: 'Gemini CLI execution result',
            details: result,
            files_changed: uniqueFiles,
            duration: durationSecs,
          });

          await IssueService.updateStatus(id, 'testing');
          await LogService.create(
            id,
            'Execution Complete',
            `Gemini CLI finished execution in ${durationStr}. Moved to testing.`,
          );
        })
        .catch(async (error) => {
          console.error(`Gemini execution failed for issue ${id}:`, error);
          await LogService.create(
            id,
            'Execution Error',
            `Gemini execution failed: ${error.message}`,
          );
          await IssueService.updateStatus(id, 'todo');
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
