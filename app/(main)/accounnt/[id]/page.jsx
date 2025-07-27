import React from 'react';

export default function AccountDetailPage({ params }) {
    const { id } = params;
    
    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold mb-4">Account Details</h1>
            <p className="text-gray-600">Account ID: {id}</p>
            <p className="text-sm text-gray-500 mt-4">
                This page is under construction. Account details will be displayed here.
            </p>
        </div>
    );
}
