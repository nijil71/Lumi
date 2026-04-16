// ─── lumi-cli / taskrunner ────────────────────────────────────────────────
// Zero-dependency sequential task execution engine.
// Automates Spinner instantiation, task reporting, and error handling.

import { Spinner } from '../spinners/index.js';
import { c as colors, writeln, isTTY } from '../ansi.js';

export class TaskRunner {
  /**
   * @param {Array<{title: string, task: function}>} tasks 
   * @param {object} options 
   */
  constructor(tasks, options = {}) {
    if (!Array.isArray(tasks)) {
      throw new Error('lumi TaskRunner: expected an array of tasks.');
    }
    this._tasks = tasks;
    this._ctx = {};
    this._options = options;
  }

  /**
   * Execute all tasks sequentially.
   * @returns {Promise<object>} Returns the accumulated context object.
   */
  async run() {
    this._ctx = {};
    
    for (let i = 0; i < this._tasks.length; i++) {
      const t = this._tasks[i];
      let sp = null;
      
      const prefix = `[${i + 1}/${this._tasks.length}]`;

      if (isTTY()) {
         sp = new Spinner({ 
             type: this._options.spinner || 'braille', 
             prefix, 
             text: t.title,
             color: this._options.color || 'default'
         }).start();
      } else {
         writeln(`${colors.slate}${prefix}${colors.r} ${colors.chalk}${t.title}${colors.r}`);
      }

      // Safe mutator object exposed to the user task for modifying spinner state
      const taskControls = {
        set text(val) {
          if (sp) sp.setText(val);
        }
      };

      try {
        if (typeof t.task !== 'function') {
           throw new Error(`Task '${t.title}' is missing a valid task function.`);
        }
        
        // Pass shared context and control object
        await t.task(this._ctx, taskControls);
        
        if (sp) sp.succeed(t.title);
      } catch (err) {
        if (sp) sp.fail(`${t.title} ${colors.slate}— ${err.message}${colors.r}`);
        else writeln(`${colors.signal}✘${colors.r} ${t.title} - ${err.message}`);
        
        if (this._options.exitOnError !== false) {
           throw err; // Stop workflow if one task breaks
        }
      }
    }
    
    return this._ctx;
  }
}

export function taskRunner(tasks, options) {
  return new TaskRunner(tasks, options);
}
