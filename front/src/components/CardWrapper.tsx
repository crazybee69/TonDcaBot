import React, {ReactNode} from "react";

export function CardWrapper({children}: { children: ReactNode }) {
    return (
        <div className="flex-1 flex items-center relative">
            {children}
        </div>
    )
}