/**
 * Type definitions for the V2 dashboard wiring, widget schema, and spec system.
 */

//--------------------------------------------------
// Widget Schema Types
//--------------------------------------------------

/** Full metadata for a widget type — schema, inputs, outputs, config. */
export interface WidgetMeta {
    id: string;
    title: string;
    description: string;
    category: 'input' | 'display' | 'utility';
    inputs: InputDef[];
    outputs: OutputDef[];
    config: Record<string, ConfigPropertyDef>;
    defaultSize: {w: number; h: number};
    idealSize?: {w?: number; h?: number};
    minSize?: {w?: number; h?: number};
    maxSize?: {w?: number; h?: number};
}

/** Declared input a widget accepts. */
export interface InputDef {
    name: string;
    type: string;
    required?: boolean;
    default?: any;
    description: string;
}

/** Declared output a widget publishes. */
export interface OutputDef {
    name: string;
    type: string;
    description: string;
}

/** Config property definition within a widget schema. */
export interface ConfigPropertyDef {
    type: 'string' | 'number' | 'boolean' | 'enum' | 'string[]';
    description: string;
    default?: any;
    enum?: string[];
    min?: number;
    max?: number;
    required?: boolean;
}

//--------------------------------------------------
// Wiring / Binding Types
//--------------------------------------------------

/** A binding connects a widget input to a source. */
export type BindingSpec = {fromWidget: string; output: string} | {const: any};

/** Map of input name → binding spec for a widget instance. */
export type BindingsMap = Record<string, BindingSpec>;

//--------------------------------------------------
// Dashboard Spec Types
//--------------------------------------------------

/** The full dashboard spec — matches DashCanvasModel's persisted state. */
export interface DashSpec {
    version?: number;
    state: DashWidgetState[];
}

/** State for a single widget instance in the spec. */
export interface DashWidgetState {
    viewSpecId: string;
    layout: {x: number; y: number; w: number; h: number};
    title?: string;
    state?: Record<string, any>;
}

//--------------------------------------------------
// Validation Types
//--------------------------------------------------

export interface ValidationResult {
    valid: boolean;
    errors: ValidationMessage[];
    warnings: ValidationMessage[];
}

export interface ValidationMessage {
    level: 'error' | 'warning';
    path: string;
    code: string;
    message: string;
}
