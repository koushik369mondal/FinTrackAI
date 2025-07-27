import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import React from 'react'

export default function AccountCard({account}) {
    const{name, type, balance, id, isDefault} = account;
    return (
        <Card>
            <CardHeader>
                <CardTitle>{name}</CardTitle>
                <Switch/>
            </CardHeader>
            <CardContent>
                <div className='text-2xl font-bold'>
                    ${parseFloat(balance).toFixed(2)}
                </div>
                <p className='text-xs text-muted-foreground capitalize'>
                    {type} Account
                </p>
            </CardContent>
            <CardFooter>
                <p>Card Footer</p>
            </CardFooter>
        </Card>
    )
}
