"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.runK6 = runK6;
const child_process_1 = require("child_process");
const path = __importStar(require("path"));
const parser_1 = require("./parser");
const generator_1 = require("./generator");
function runK6(options = {}) {
    const featuresDir = options.featuresDir ? path.resolve(options.featuresDir) : path.resolve(process.cwd(), 'features');
    const scenarios = (0, parser_1.parseFeatures)(featuresDir);
    const resources = options.resources || {};
    console.error(`[k6-gherkin] Loaded ${scenarios.length} scenario(s) from ${featuresDir}`);
    const script = (0, generator_1.generateScript)(scenarios, resources, options);
    const k6Args = options.k6Args || ['run', '--iterations', '1', '--duration', '30m', '-'];
    const k6 = (0, child_process_1.spawn)('k6', k6Args, {
        stdio: ['pipe', 'inherit', 'inherit'],
        cwd: options.cwd || process.cwd(),
    });
    k6.stdin.write(script);
    k6.stdin.end();
    k6.on('error', (err) => {
        console.error('[k6-gherkin] Failed to start k6:', err.message);
        process.exit(1);
    });
    k6.on('exit', (code) => {
        process.exit(code ?? 0);
    });
}
