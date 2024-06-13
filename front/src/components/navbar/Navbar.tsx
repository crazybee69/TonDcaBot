import {TonConnectButton} from "@tonconnect/ui-react";

export function Navbar() {


    return (
        <>
            <header
                className="flex justify-between items-center py-2 pl-3 xs:pr-1 sm:pr-4 md:pr-6 -mr-1 gap-1 md:gap-2">
                <div className="flex mr-auto items-center gap-4">
                    <a className="ml-[-3px]" href="https://app.evaa.finance/">
                        <div className="flex items-center gap-1">
                            <svg width="48" height="48" viewBox="0 0 42 42" xmlns="http://www.w3.org/2000/svg"
                                 className="transition-colors duration-1000">
                                <g clip-path="url(#a)" fill="currentColor">
                                    <path
                                        d="M31.733 9s-7.552 1.857-10.504 2.663l-5.38 1.262-4.836-1.262S11 15.328 11 17.198l4.889 1.352s15.844-4.017 15.844-3.91V9z"></path>
                                    <path
                                        d="M29.094 16.367 15.8 19.741 11 18.433l.012 5.388c1.23.446 4.831 1.53 4.831 1.53l13.251-3.343v-5.64z"></path>
                                    <path
                                        d="M15.912 26.529 11 25.342s.013 1.135.013 2.71v2.861l4.815 1.288 15.905-3.935V22.65l-15.821 3.88z"></path>
                                </g>
                                <defs>
                                    <clipPath id="a">
                                        <path transform="translate(11 9)" d="M0 0h20.733v24H0z"></path>
                                    </clipPath>
                                </defs>
                            </svg>
                            <span
                                className="hidden font-black text-sm uppercase w-20 leading-[14px] md:block transition-colors  duration-1000">TON DCA Bot</span>
                        </div>
                    </a>
                </div>

                <div className="flex items-center space-x-4">
                    <TonConnectButton/>
                </div>
            </header>
        </>
    )
}