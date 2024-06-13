import {CardWrapper} from "../CardWrapper";

export function BalanceCard() {

    return (
        <CardWrapper>
            <div className="flex flex-col px-5 pt-3 pb-5 w-full md:pr-12">
                <div className="flex flex-row items-center justify-between">
                    <div className="flex justify-center flex-col">
                        <div className="text-md text-muted-foreground">My Balance</div>

                        <div className="flex flex-row items-baseline font-display mt-1.5 h-14"><span
                            className="text-3xl font-sans font-bold">$</span><span
                            className="text-5xl font-bold">179</span>
                            <div className="text-3xl font-black">.53</div>
                        </div>
                    </div>

                    <div className="flex items-center"><a
                        className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.95] border border-primary text-foreground hover:text-accent-foreground h-10 w-10 group bg-black dark:bg-white p-0 hover:scale-[1.05] border-none transition-all"
                        href="https://app.evaa.finance/transaction/Supply"><span
                        className="inline-flex items-center justify-center bg-white dark:bg-black rounded-full w-4 h-4"><span
                        className="inline-flex items-center justify-center h-10 min-w-10 transition-colors"><svg
                        xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none"
                        className="h-6 w-6 min-w-6 text-black dark:text-white"><path fill="currentColor"
                                                                                     fill-rule="evenodd"
                                                                                     d="M3 12a9.5 9.5 0 1 1 19 0 9.5 9.5 0 0 1-19 0Zm9.5-5.036a.75.75 0 0 1 .75.75v3.536h3.536a.75.75 0 0 1 0 1.5H13.25v3.536a.75.75 0 0 1-1.5 0V12.75H8.214a.75.75 0 0 1 0-1.5h3.536V7.714a.75.75 0 0 1 .75-.75Z"
                                                                                     clip-rule="evenodd"></path></svg></span></span></a>
                    </div>
                </div>
            </div>
        </CardWrapper>
    )
}