export const Background = () => {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] rounded-full bg-(--cud-blue)/10 blur-[120px]"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] rounded-full bg-(--cud-purple)/10 blur-[120px]"></div>
        </div>
    )
}