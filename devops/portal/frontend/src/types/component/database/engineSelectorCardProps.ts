import type { DatabaseEngine, DatabaseMode } from "../../database";

export interface EngineSelectorCardProps {
    selectedEngine: DatabaseEngine;
    selectedMode: DatabaseMode;
    onEngineChange: (engine: DatabaseEngine) => void;
    onModeChange: (mode: DatabaseMode) => void;
    disabled?: boolean | undefined;
}
