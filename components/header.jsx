import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";

const Header = () => {
    return (
        <div className="fixed top-0">
            <nav>
                <Link href="/">
                <Image src={"/logo.png"}
                alt="FinTrackAi Logo"
                height={60}
                width={200}
                className="h-12 w-auto object-contain"
                />
                </Link>
            </nav>

            <SignedOut>
                <SignInButton />
            </SignedOut>
            <SignedIn>
                <UserButton />
            </SignedIn>
        </div>
    );
};

export default Header;

