"use client";

import Link from "next/link";
import { Button } from "./ui/button";
import Image from "next/image";

const HeroSection = () => {
    return (
        <div className="pb-20 px-4">
            <div>
                <h1>
                    Manage Your Finances <br /> with Intelligence
                </h1>
                <p>
                    An AI-powered personal finance app that helps you track your expenses,
                    set budgets, and achieve your financial goals.
                </p>
                <div>
                    <Link href="/dashboard">
                        <Button size="lg" className="px-8">
                            Get Started
                        </Button>
                    </Link>
                    <Link href="https://youtu.be/egS6fnZAdzk?si=sawYgVMVyaGPRo1g">
                        <Button size="lg" variant="outline" className="px-8">
                            Watch Demo
                        </Button>
                    </Link>
                </div>
                <div>
                    <div>
                        <Image
                            src="/banner.jpeg"
                            width={1280}
                            height={720}
                            alt="Dashboard Preview"
                            className="rounded-lg shadow-2xl border mx-auto"
                            priority
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HeroSection;
