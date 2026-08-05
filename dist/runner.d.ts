import { GeneratorOptions } from './generator';
export interface RunK6Options extends GeneratorOptions {
    featuresDir?: string;
    resources?: Record<string, any[]>;
    k6Args?: string[];
    cwd?: string;
}
export declare function runK6(options?: RunK6Options): void;
