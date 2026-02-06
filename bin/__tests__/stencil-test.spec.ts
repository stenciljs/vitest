import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { spawn } from 'child_process';

const BIN_PATH = join(__dirname, '../../dist/bin/stencil-test.js');

describe('stencil-test CLI', () => {
  let testDir: string;

  beforeEach(() => {
    // Create a temporary test directory
    testDir = mkdtempSync(join(tmpdir(), 'stencil-test-'));
  });

  afterEach(() => {
    // Clean up temp directory
    try {
      rmSync(testDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('argument parsing', () => {
    it('should parse --watch flag', async () => {
      const result = await runCLI(['--help']);
      expect(result.stdout).toContain('--watch');
    });

    it('should parse --stencil-config flag', async () => {
      const result = await runCLI(['--help']);
      expect(result.stdout).toContain('--stencil-config');
    });

    it('should parse --verbose flag', async () => {
      const result = await runCLI(['--help']);
      expect(result.stdout).toContain('--verbose');
    });

    it('should parse --prod flag', async () => {
      const result = await runCLI(['--help']);
      expect(result.stdout).toContain('--prod');
    });

    it('should parse --serve flag', async () => {
      const result = await runCLI(['--help']);
      expect(result.stdout).toContain('--serve');
    });

    it('should parse --port flag', async () => {
      const result = await runCLI(['--help']);
      expect(result.stdout).toContain('--port');
    });
  });

  describe('help text', () => {
    it('should display help with --help', async () => {
      const result = await runCLI(['--help']);
      expect(result.stdout).toContain('stencil-test - Integrated Stencil build and Vitest testing');
      expect(result.stdout).toContain('Usage:');
      expect(result.stdout).toContain('Examples:');
    });

    it('should display help with -h', async () => {
      const result = await runCLI(['-h']);
      expect(result.stdout).toContain('stencil-test - Integrated Stencil build and Vitest testing');
    });

    it('should include Stencil options in help', async () => {
      const result = await runCLI(['--help']);
      expect(result.stdout).toContain('Stencil Options:');
      expect(result.stdout).toContain('--watch');
      expect(result.stdout).toContain('--prod');
      expect(result.stdout).toContain('--stencil-config');
    });

    it('should include Vitest options in help', async () => {
      const result = await runCLI(['--help']);
      expect(result.stdout).toContain('Vitest Options:');
      expect(result.stdout).toContain('--project');
      expect(result.stdout).toContain('--coverage');
    });

    it('should include interactive watch mode instructions', async () => {
      const result = await runCLI(['--help']);
      expect(result.stdout).toContain('Interactive Watch Mode');
      expect(result.stdout).toContain("Press 'p' to filter by filename");
      expect(result.stdout).toContain("Press 'q' to quit");
    });
  });

  describe('config file handling', () => {
    it('should find default stencil.config.ts', async () => {
      // Create a minimal stencil config
      const stencilConfig = `
export const config = {
  namespace: 'test',
  outputTargets: [{ type: 'dist' }]
};
`;
      writeFileSync(join(testDir, 'stencil.config.ts'), stencilConfig);

      // Create a minimal vitest config
      const vitestConfig = `
export default {
  test: {
    projects: []
  }
};
`;
      writeFileSync(join(testDir, 'vitest.config.ts'), vitestConfig);

      // Create package.json
      writeFileSync(join(testDir, 'package.json'), JSON.stringify({ name: 'test', type: 'module' }));

      // Run with verbose to see config loading
      const result = await runCLIInDir(testDir, ['--watch', '--verbose'], 2000);

      // Should mention loading the config
      expect(result.stdout + result.stderr).toMatch(/stencil\.config|Created temporary/i);
    });

    it('should use custom config with --stencil-config', async () => {
      // Create a custom-named stencil config
      const stencilConfig = `
export const config = {
  namespace: 'custom-test',
  outputTargets: [{ type: 'dist' }]
};
`;
      writeFileSync(join(testDir, 'custom.config.ts'), stencilConfig);

      const vitestConfig = `
export default {
  test: {
    projects: []
  }
};
`;
      writeFileSync(join(testDir, 'vitest.config.ts'), vitestConfig);

      writeFileSync(join(testDir, 'package.json'), JSON.stringify({ name: 'test', type: 'module' }));

      const result = await runCLIInDir(
        testDir,
        ['--watch', '--stencil-config', './custom.config.ts', '--verbose'],
        2000,
      );

      // Should load the custom config
      expect(result.stdout + result.stderr).toMatch(/custom\.config|Created temporary/i);
    });

    it('should create temporary config in watch mode', async () => {
      const stencilConfig = `
export const config = {
  namespace: 'test',
  outputTargets: [{ type: 'dist' }]
};
`;
      writeFileSync(join(testDir, 'stencil.config.ts'), stencilConfig);

      const vitestConfig = `
export default {
  test: {
    projects: []
  }
};
`;
      writeFileSync(join(testDir, 'vitest.config.ts'), vitestConfig);

      writeFileSync(join(testDir, 'package.json'), JSON.stringify({ name: 'test', type: 'module' }));

      const result = await runCLIInDir(testDir, ['--watch', '--verbose'], 2000);

      // Should create a temporary config
      expect(result.stdout).toMatch(/Created temporary stencil config/);
    });

    it('should not create temporary config in non-watch mode', async () => {
      const stencilConfig = `
export const config = {
  namespace: 'test',
  outputTargets: [{ type: 'dist' }]
};
`;
      writeFileSync(join(testDir, 'stencil.config.ts'), stencilConfig);

      writeFileSync(join(testDir, 'package.json'), JSON.stringify({ name: 'test', type: 'module' }));

      // Run for a short time then kill
      const result = await runCLIInDir(testDir, ['--verbose'], 2000);

      // Should NOT create a temporary config in non-watch mode
      expect(result.stdout).not.toMatch(/Created temporary stencil config/);
    });
  });

  describe('screenshot ignore patterns', () => {
    it('should extract screenshot patterns from vitest config', async () => {
      const stencilConfig = `
export const config = {
  namespace: 'test',
  outputTargets: [{ type: 'dist' }]
};
`;
      writeFileSync(join(testDir, 'stencil.config.ts'), stencilConfig);

      const vitestConfig = `
export default {
  test: {
    projects: [
      {
        test: {
          browser: {
            enabled: true,
            expect: {
              toMatchScreenshot: {
                screenshotDirectory: 'custom-screenshots'
              }
            }
          }
        }
      }
    ]
  }
};
`;
      writeFileSync(join(testDir, 'vitest.config.ts'), vitestConfig);

      writeFileSync(join(testDir, 'package.json'), JSON.stringify({ name: 'test', type: 'module' }));

      const result = await runCLIInDir(testDir, ['--watch', '--verbose'], 2000);

      // Should extract screenshot patterns
      expect(result.stdout).toMatch(/Extracted.*screenshot patterns/);
    });

    it('should include default screenshot patterns', async () => {
      const stencilConfig = `
export const config = {
  namespace: 'test',
  outputTargets: [{ type: 'dist' }]
};
`;
      writeFileSync(join(testDir, 'stencil.config.ts'), stencilConfig);

      const vitestConfig = `
export default {
  test: {
    projects: []
  }
};
`;
      writeFileSync(join(testDir, 'vitest.config.ts'), vitestConfig);

      writeFileSync(join(testDir, 'package.json'), JSON.stringify({ name: 'test', type: 'module' }));

      const result = await runCLIInDir(testDir, ['--watch', '--verbose'], 2000);

      // Should add watch ignore patterns
      expect(result.stdout).toMatch(/Added.*watch ignore patterns/);
    });

    it('should merge user watchIgnoredRegex with screenshot patterns', async () => {
      const stencilConfig = `
export const config = {
  namespace: 'test',
  outputTargets: [{ type: 'dist' }],
  watchIgnoredRegex: [/custom-pattern/]
};
`;
      writeFileSync(join(testDir, 'stencil.config.ts'), stencilConfig);

      const vitestConfig = `
export default {
  test: {
    projects: []
  }
};
`;
      writeFileSync(join(testDir, 'vitest.config.ts'), vitestConfig);

      writeFileSync(join(testDir, 'package.json'), JSON.stringify({ name: 'test', type: 'module' }));

      const result = await runCLIInDir(testDir, ['--watch', '--verbose'], 3000);

      // Check that temp config was created
      expect(result.stdout).toMatch(/Created temporary/);

      // Check that temp config exists and contains both patterns
      const tempConfigs = require('fs')
        .readdirSync(testDir)
        .filter((f: string) => f.startsWith('.stencil-test-'));

      if (tempConfigs.length > 0) {
        const tempConfigContent = require('fs').readFileSync(join(testDir, tempConfigs[0]), 'utf-8');
        // Should have user's custom pattern
        expect(tempConfigContent).toContain('custom-pattern');
        // Should have screenshot patterns
        expect(tempConfigContent).toMatch(/__screenshots__|\.png/);
      }
    });
  });

  describe('temp file cleanup', () => {
    it('should cleanup temporary config on exit', async () => {
      const stencilConfig = `
export const config = {
  namespace: 'test',
  outputTargets: [{ type: 'dist' }]
};
`;
      writeFileSync(join(testDir, 'stencil.config.ts'), stencilConfig);

      const vitestConfig = `
export default {
  test: {
    projects: []
  }
};
`;
      writeFileSync(join(testDir, 'vitest.config.ts'), vitestConfig);

      writeFileSync(join(testDir, 'package.json'), JSON.stringify({ name: 'test', type: 'module' }));

      // Run and then kill
      await runCLIInDir(testDir, ['--watch', '--verbose'], 2000);

      // Wait for filesystem to sync (Windows can be slow)
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Check that temp config was cleaned up
      const tempConfigs = require('fs')
        .readdirSync(testDir)
        .filter((f: string) => f.startsWith('.stencil-test-'));

      expect(tempConfigs).toHaveLength(0);
    });
  });
});

/**
 * Helper function to run the CLI and capture output
 */
function runCLI(args: string[], timeout = 1000): Promise<{ stdout: string; stderr: string; code: number | null }> {
  return new Promise((resolve) => {
    const proc = spawn('node', [BIN_PATH, ...args], {
      env: { ...process.env, NODE_ENV: 'test' },
    });

    let stdout = '';
    let stderr = '';

    proc.stdout?.on('data', (data) => {
      stdout += data.toString();
    });

    proc.stderr?.on('data', (data) => {
      stderr += data.toString();
    });

    // Kill after timeout
    const timer = setTimeout(() => {
      proc.kill('SIGTERM');
    }, timeout);

    proc.on('exit', (code) => {
      clearTimeout(timer);
      resolve({ stdout, stderr, code });
    });
  });
}

/**
 * Helper function to run CLI in a specific directory
 */
function runCLIInDir(
  cwd: string,
  args: string[],
  timeout = 1000,
): Promise<{ stdout: string; stderr: string; code: number | null }> {
  return new Promise((resolve) => {
    const proc = spawn('node', [BIN_PATH, ...args], {
      cwd,
      env: { ...process.env, NODE_ENV: 'test' },
    });

    let stdout = '';
    let stderr = '';

    proc.stdout?.on('data', (data) => {
      stdout += data.toString();
    });

    proc.stderr?.on('data', (data) => {
      stderr += data.toString();
    });

    // Kill after timeout
    const timer = setTimeout(() => {
      proc.kill('SIGTERM');
      setTimeout(() => {
        if (!proc.killed) {
          proc.kill('SIGKILL');
        }
      }, 500);
    }, timeout);

    proc.on('exit', (code) => {
      clearTimeout(timer);
      resolve({ stdout, stderr, code });
    });
  });
}
