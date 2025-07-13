'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, Copy, Check, ArrowLeft } from 'lucide-react';
import { CopyToClipboard } from 'react-copy-to-clipboard';

function SyncSuccessContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [copySuccess, setCopySuccess] = useState(false);
    const [passphrase, setPassphrase] = useState('');

    useEffect(() => {
        const passphraseParam = searchParams.get('passphrase');
        if (passphraseParam) {
            setPassphrase(decodeURIComponent(passphraseParam));
        } else {
            // If no passphrase, redirect back to settings
            router.push('/settings');
        }
    }, [searchParams, router]);

    const handleCopySuccess = () => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
    };

    const handleContinue = () => {
        // Replace the current history entry to prevent back navigation to this page
        router.replace('/settings');
    };

    if (!passphrase) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-6">
            {/* Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-2xl mx-auto px-4 py-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.push('/')}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <h1 className="text-xl font-semibold">Sync Enabled</h1>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-2xl mx-auto px-4 py-6">
                {/* Success Message */}
                <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
                    <div className="flex items-center gap-3 mb-4">
                        <CheckCircle className="w-8 h-8 text-green-600" />
                        <div>
                            <h2 className="text-xl font-semibold">Sync Enabled Successfully!</h2>
                            <p className="text-gray-600 text-sm mt-1">
                                Your notes are now syncing across all your devices
                            </p>
                        </div>
                    </div>
                </div>

                {/* Passphrase Section */}
                <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
                    <h3 className="text-lg font-semibold mb-4 text-blue-800">Your Passphrase</h3>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                        <textarea
                            value={passphrase}
                            readOnly
                            className="font-mono text-lg bg-white p-3 rounded border w-full resize-none mb-3"
                            rows={3}
                        />
                        <CopyToClipboard
                            text={passphrase}
                            onCopy={handleCopySuccess}
                        >
                            <button
                                className={`w-full py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 font-medium ${copySuccess
                                    ? 'bg-green-100 text-green-800 border border-green-300'
                                    : 'bg-white text-blue-800 border border-blue-300 hover:bg-blue-50'
                                    }`}
                            >
                                {copySuccess ? (
                                    <>
                                        <Check className="w-4 h-4" />
                                        Copied to Clipboard!
                                    </>
                                ) : (
                                    <>
                                        <Copy className="w-4 h-4" />
                                        Copy to Clipboard
                                    </>
                                )}
                            </button>
                        </CopyToClipboard>
                    </div>
                </div>

                {/* Backup Instructions */}
                <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
                    <h3 className="text-lg font-semibold mb-4 text-orange-600">
                        🔒 Important: Save Your Passphrase
                    </h3>

                    <div className="prose prose-sm max-w-none">
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                            <p className="text-red-800 font-medium mb-2">
                                Your passphrase is the ONLY way to access your synced notes on other devices.
                            </p>
                            <p className="text-red-700 text-sm">
                                If you lose it, you&apos;ll lose access to your synced data.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <h4 className="font-medium text-green-700 mb-2">✅ Recommended storage methods:</h4>
                                <ul className="text-sm text-gray-700 space-y-1 ml-4">
                                    <li>• Password manager (1Password, Bitwarden, etc.)</li>
                                    <li>• Secure note-taking app</li>
                                    <li>• Write it down and store in a safe place</li>
                                </ul>
                            </div>

                            <div>
                                <h4 className="font-medium text-red-700 mb-2">❌ DO NOT:</h4>
                                <ul className="text-sm text-gray-700 space-y-1 ml-4">
                                    <li>• Share it with anyone</li>
                                    <li>• Store it in plain text files</li>
                                    <li>• Email it to yourself</li>
                                    <li>• Save it in browser bookmarks</li>
                                </ul>
                            </div>

                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <p className="text-blue-800 text-sm">
                                    <strong>How it works:</strong> Your notes are now syncing securely across all your devices using this passphrase as your unique key.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Continue Button */}
                <div className="sticky bottom-0 bg-white border-t p-4 -mx-4">
                    <button
                        onClick={handleContinue}
                        className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                        I&apos;ve Saved My Passphrase
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function SyncSuccessPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        }>
            <SyncSuccessContent />
        </Suspense>
    );
}
