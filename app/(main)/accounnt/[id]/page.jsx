import { getAccountWithTransactions } from '@/actions/accounts';
import { notFound } from 'next/navigation';
import React from 'react';
import { get } from 'react-hook-form';

export default async function AccountDetailPage({ params }) {
    const accountData = await getAccountWithTransactions(params.id);
    
    if(!accountData){
        notFound();
    }
    return (
        <div className="">
            {params.id}
        </div>
    );
}
