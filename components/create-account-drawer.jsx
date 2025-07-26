"use client";

import React, { useState } from 'react'

import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from './ui/drawer';

export default function CreateAccountDrawer({children}) {
    const [open, setOpen] = useState(false);

    return (
        <Drawer open={open} onOpenChange={setOpen}>
            <DrawerTrigger asChild>{children}</DrawerTrigger>
            <DrawerContent>
                <DrawerHeader>
                    <DrawerTitle>Create New Account</DrawerTitle>
                </DrawerHeader>
                <div>
                    <form action="">
                        
                    </form>
                </div>
            </DrawerContent>
        </Drawer>
    )
}
