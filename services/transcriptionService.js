import { spawn } from 'node:child_process';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(currentDir, '..');
const scriptPath = path.join(projectRoot, 'scripts', 'transcribe_with_whisper.py');
const defaultPythonPath = path.join(projectRoot, '.tools', 'python', 'python.exe');
const defaultModelCacheDir = path.join(projectRoot, '.cache', 'whisper');

function getPythonPath() {
  return process.env.WHISPER_PYTHON_PATH || defaultPythonPath;
}

function getWhisperModel() {
  return process.env.WHISPER_MODEL || 'small';
}

function getAudioExtension(file) {
  const mimeType = String(file.mimetype || '').toLowerCase();
  const originalName = String(file.originalname || '').toLowerCase();

  if (mimeType.includes('webm') || originalName.endsWith('.webm')) {
    return '.webm';
  }

  if (mimeType.includes('ogg') || originalName.endsWith('.ogg') || originalName.endsWith('.opus')) {
    return '.ogg';
  }

  if (mimeType.includes('wav') || originalName.endsWith('.wav')) {
    return '.wav';
  }

  return '.webm';
}

async function ensureRuntimeExists() {
  await fs.access(scriptPath);

  const pythonPath = getPythonPath();

  try {
    await fs.access(pythonPath);
  } catch {
    throw new Error(
      `Local Whisper runtime is missing. Expected Python at ${pythonPath}. Reinstall the project Whisper tools or set WHISPER_PYTHON_PATH.`,
    );
  }
}

async function runWhisper(audioPath) {
  await ensureRuntimeExists();
  await fs.mkdir(defaultModelCacheDir, { recursive: true });

  const pythonPath = getPythonPath();
  const args = [
    scriptPath,
    '--audio',
    audioPath,
    '--model',
    getWhisperModel(),
    '--language',
    'ko',
    '--cache-dir',
    defaultModelCacheDir,
  ];

  return new Promise((resolve, reject) => {
    const child = spawn(pythonPath, args, {
      cwd: projectRoot,
      windowsHide: true,
      env: {
        ...process.env,
        HF_HUB_DISABLE_TELEMETRY: '1',
        PYTHONUTF8: '1',
        PYTHONIOENCODING: 'utf-8',
      },
    });

    let stdout = '';
    let stderr = '';

    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');

    child.stdout.on('data', (chunk) => {
      stdout += chunk;
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk;
    });

    child.on('error', (error) => {
      reject(error);
    });

    child.on('close', (code) => {
      if (code !== 0) {
        reject(
          new Error(
            stderr.trim() || `Whisper transcription failed with exit code ${code}.`,
          ),
        );
        return;
      }

      try {
        const parsed = JSON.parse(stdout.trim());
        resolve(parsed);
      } catch {
        reject(new Error('Whisper returned an invalid response.'));
      }
    });
  });
}

export async function transcribeAudioFile(file) {
  if (!file?.buffer?.length) {
    throw new Error('Audio file is empty.');
  }

  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'moodtalk-whisper-'));
  const audioPath = path.join(tempDir, `recording${getAudioExtension(file)}`);

  try {
    await fs.writeFile(audioPath, file.buffer);
    const result = await runWhisper(audioPath);

    if (!result?.text?.trim()) {
      throw new Error('Whisper could not detect any speech from the uploaded audio.');
    }

    return result.text.trim();
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
}
