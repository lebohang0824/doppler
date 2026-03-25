import { ProjectService } from '../../../../lib/services/project-service.js';
import { IssueService } from '../../../../lib/services/issue-service.js';
import { SettingsService } from '../../../../lib/services/settings-service.js';
import {
  runGeminiRequest,
} from '../../../../lib/gemini-service.js';
import {
  runOpencodeRequest,
} from '../../../../lib/opencode-service.js';

const EXCLUDED_STATUSES = ['todo', 'queued', 'executing', 'testing', 'done'];

export const POST = async ({ params, request }) => {
  const { id } = params;
  
  if (!id) {
    return new Response(JSON.stringify({ error: 'Project ID is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const project = await ProjectService.getById(id);
    if (!project) {
      return new Response(JSON.stringify({ error: 'Project not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const allIssues = await IssueService.getAll(id);
    const existingTasks = allIssues
      .filter(issue => EXCLUDED_STATUSES.includes(issue.status.toLowerCase()))
      .map(issue => `- ${issue.title}`);

    const existingTasksSection = existingTasks.length > 0
      ? `\n\nIMPORTANT: Do NOT suggest tasks that are already in progress, completed, or queued. The following tasks already exist:\n${existingTasks.join('\n')}`
      : '';

    if (!project.description || project.description.trim().length < 10) {
      return new Response(
        JSON.stringify({ 
          error: 'Project description must be at least 10 characters. Please edit it in Manage Project.' 
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const body = await request.json();
    const { provider, model_id } = body;

    const prompt = `Based on the following project description, generate a list of tasks needed to implement this project. 
Format the output as a JSON array of tasks with "title" and "description" fields. 
Each task should be a specific, actionable item that can be implemented independently.
Project Description:
${project.description}${existingTasksSection}

Respond ONLY with a valid JSON array in this exact format:
[{"title": "Task title", "description": "Task description"}, ...]`;

    let aiResult;
    
    if (provider === 'opencode') {
      aiResult = await runOpencodeRequest(
        prompt,
        project.directory,
        {},
        model_id
      );
    } else {
      const escapedPrompt = prompt.replace(/"/g, '\\"');
      const args = ['fix', `"${escapedPrompt}"`];
      aiResult = await runGeminiRequest(
        args,
        project.directory,
        {},
        model_id
      );
    }

    let tasks = [];
    try {
      const jsonMatch = aiResult.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        tasks = JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      tasks = [];
    }

    return new Response(JSON.stringify({ 
      tasks,
      report: aiResult 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Plan generation failed:', error);
    return new Response(
      JSON.stringify({ error: `Failed to generate plan: ${error.message}` }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
