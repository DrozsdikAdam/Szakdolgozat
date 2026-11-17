import { Component, type ErrorInfo, type ReactNode } from "react";
import { ErrorState } from "./ErrorState";
import { Button } from "./Button";

interface ErrorBoundaryProps {
    children: ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    message: string;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, message: "" };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return {
            hasError: true,
            message: error?.message || "Váratlan megjelenítési hiba történt."
        };
    }

    componentDidCatch(error: Error, info: ErrorInfo): void {
        console.error("[ErrorBoundary] Kezeletlen UI hiba:", error, info);
    }

    private handleReset = (): void => {
        this.setState({ hasError: false, message: "" });
        window.location.href = "/";
    };

    render(): ReactNode {
        if (this.state.hasError) {
            return (
                <div className="py-8">
                    <ErrorState
                        type="generic"
                        title="Váratlan felületi hiba történt"
                        message={this.state.message}
                        errorCode="UI_RENDER_ERROR"
                        action={
                            <Button variant="primary" size="md" onClick={this.handleReset}>
                                Vissza a kezdőlapra
                            </Button>
                        }
                    />
                </div>
            );
        }

        return this.props.children;
    }
}
