'use client';

import React, { useState, useEffect } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { ArrowLeft, Key, Cloud, CloudOff, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
    syncSettingsAtom,
    currentUserAtom,
    enableSyncAtom,
    disableSyncAtom,
    updateSyncSettingsAtom,
    offlineNotesAtom,
    syncedNotesAtom,
    conflictNotesOnlyAtom,
    syncNotesAtom,
    initializeSyncAtom
} from '../../lib/atoms';
import { generatePassphrase, validatePassphrase } from '../../lib/passphrase';
import { syncService } from '../../lib/syncService';
import { isSupabaseConfigured } from '../../lib/supabase';

export default function SettingsPage() {
    const router = useRouter();

    // Jotai state
    const syncSettings = useAtomValue(syncSettingsAtom);
    const currentUser = useAtomValue(currentUserAtom);
    const enableSync = useSetAtom(enableSyncAtom);
    const disableSync = useSetAtom(disableSyncAtom);
    const updateSyncSettings = useSetAtom(updateSyncSettingsAtom);
    const syncNotes = useSetAtom(syncNotesAtom);
    const initializeSync = useSetAtom(initializeSyncAtom);
    const offlineNotes = useAtomValue(offlineNotesAtom);
    const syncedNotes = useAtomValue(syncedNotesAtom);
    const conflictNotes = useAtomValue(conflictNotesOnlyAtom);

    // Local state
    const [showPassphraseForm, setShowPassphraseForm] = useState(false);
    const [passphrase, setPassphrase] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [isNewUser, setIsNewUser] = useState(false);
    const [manualSyncInProgress, setManualSyncInProgress] = useState(false);

    // Check Supabase configuration
    const supabaseConfigured = isSupabaseConfigured();

    // Auto-initialize sync when enabled
    useEffect(() => {
        console.log('Settings component mounted, checking sync state:', {
            syncEnabled: syncSettings.enabled,
            currentUser: currentUser,
            isLoading: isLoading,
            syncSettings: syncSettings
        });

        if (syncSettings.enabled && currentUser && !isLoading) {
            console.log('Auto-initializing sync due to settings change');
            initializeSync();
        }
    }, [syncSettings, currentUser, isLoading, initializeSync]);

    // Listen for auto-sync events
    useEffect(() => {
        const handleAutoSync = () => {
            if (syncSettings.enabled && currentUser) {
                console.log('Received auto-sync event, triggering sync');
                syncNotes();
            }
        };

        window.addEventListener('cardrail:auto-sync', handleAutoSync);
        return () => {
            window.removeEventListener('cardrail:auto-sync', handleAutoSync);
        };
    }, [syncSettings.enabled, currentUser, syncNotes]);

    const formatLastSync = (lastSyncAt: string) => {
        const now = new Date();
        const lastSync = new Date(lastSyncAt);
        const diffMs = now.getTime() - lastSync.getTime();
        const diffMinutes = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);

        if (diffMinutes < 1) {
            return 'just now';
        } else if (diffMinutes < 60) {
            return `${diffMinutes}m ago`;
        } else if (diffHours < 24) {
            return `${diffHours}h ago`;
        } else {
            return lastSync.toLocaleDateString();
        }
    };

    const handleGeneratePassphrase = async () => {
        try {
            const newPassphrase = await generatePassphrase();
            setPassphrase(newPassphrase);
            setIsNewUser(true);
            setError(''); // Clear any previous errors
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Failed to generate passphrase');
        }
    };

    const handleEnableSync = async () => {
        if (!passphrase) {
            setError('Please enter or generate a passphrase');
            return;
        }

        if (!(await validatePassphrase(passphrase))) {
            setError('Invalid passphrase format. Please enter a valid BIP39 mnemonic phrase (12 words).');
            return;
        }

        setIsLoading(true);
        setError(''); try {
            console.log('Attempting to register user with passphrase:', passphrase.split(' ').length, 'words');
            const user = await syncService.registerUser(passphrase);
            console.log('User registered:', user);

            enableSync(user);
            console.log('Sync enabled');

            if (isNewUser) {
                // Navigate to sync success page with passphrase
                router.push(`/sync-success?passphrase=${encodeURIComponent(passphrase)}`);
                return;
            }

            setShowPassphraseForm(false);
            setPassphrase('');
            setIsNewUser(false);

        } catch (error) {
            console.error('Sync setup error:', error);
            setError(error instanceof Error ? error.message : 'Failed to enable sync');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDisableSync = () => {
        disableSync();
        syncService.stopAutoSync();
    };

    const handleSyncNow = async () => {
        if (!currentUser) return;

        setManualSyncInProgress(true);
        try {
            await syncNotes();
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Sync failed');
        } finally {
            setManualSyncInProgress(false);
        }
    };

    const handleUpdateAutoSync = (enabled: boolean) => {
        updateSyncSettings({ autoSync: enabled });

        if (enabled && currentUser) {
            initializeSync();
        } else {
            syncService.stopAutoSync();
        }
    };

    const handleUpdateSyncInterval = (interval: number) => {
        updateSyncSettings({ syncInterval: interval });

        if (syncSettings.autoSync && currentUser) {
            initializeSync();
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-4">
            <div className="max-w-lg mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                    <button
                        onClick={() => router.back()}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h1 className="text-2xl font-bold">Settings</h1>
                </div>

                {/* Supabase Configuration Warning */}
                {!supabaseConfigured && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                        <div className="flex items-center gap-2 text-yellow-800">
                            <AlertTriangle className="w-5 h-5" />
                            <span className="font-medium">Sync Not Available</span>
                        </div>
                        <p className="text-sm text-yellow-700 mt-1">
                            Supabase is not configured. Add your Supabase URL and API key to .env.local to enable sync.
                        </p>
                    </div>
                )}

                {/* Sync Status Card */}
                <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold">Sync Status</h2>
                        {syncSettings.enabled ? (
                            <div className="flex items-center gap-2 text-green-600">
                                <Cloud className="w-5 h-5" />
                                <span className="text-sm font-medium">Enabled</span>
                                {syncSettings.autoSync && (
                                    <div className="flex items-center gap-1">
                                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                        <span className="text-xs text-green-600">Auto</span>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-gray-500">
                                <CloudOff className="w-5 h-5" />
                                <span className="text-sm font-medium">Disabled</span>
                            </div>
                        )}
                    </div>

                    {syncSettings.enabled && currentUser && (
                        <div className="space-y-2 mb-4">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Synced Notes:</span>
                                <span className="font-medium">{syncedNotes.length}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Offline Notes:</span>
                                <span className="font-medium">{offlineNotes.length}</span>
                            </div>
                            {conflictNotes.length > 0 && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-orange-600">Conflicts:</span>
                                    <span className="font-medium text-orange-600">{conflictNotes.length}</span>
                                </div>
                            )}
                        </div>
                    )}

                    {syncSettings.enabled ? (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <button
                                    onClick={handleSyncNow}
                                    disabled={manualSyncInProgress || !supabaseConfigured}
                                    className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all duration-200 ${manualSyncInProgress
                                        ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                        : 'bg-blue-600 text-white hover:bg-blue-700'
                                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                                >
                                    <div className="flex items-center justify-center gap-2">
                                        {manualSyncInProgress && (
                                            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                                        )}
                                        {manualSyncInProgress ? 'Syncing...' : 'Sync Now'}
                                    </div>
                                </button>
                                {syncSettings.lastSyncAt && (
                                    <div className="ml-3 text-xs text-gray-500">
                                        Last: {formatLastSync(syncSettings.lastSyncAt)}
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={handleDisableSync}
                                className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
                            >
                                Disable Sync
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => setShowPassphraseForm(true)}
                            disabled={!supabaseConfigured}
                            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Enable Sync
                        </button>
                    )}
                </div>

                {/* Auto Sync Settings */}
                {syncSettings.enabled && (
                    <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
                        <h2 className="text-lg font-semibold mb-4">Auto Sync</h2>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-gray-700">Auto Sync</span>
                                <button
                                    onClick={() => handleUpdateAutoSync(!syncSettings.autoSync)}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${syncSettings.autoSync ? 'bg-blue-600' : 'bg-gray-200'
                                        }`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${syncSettings.autoSync ? 'translate-x-6' : 'translate-x-1'
                                            }`}
                                    />
                                </button>
                            </div>

                            {syncSettings.autoSync && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Sync Interval
                                    </label>
                                    <select
                                        value={syncSettings.syncInterval}
                                        onChange={(e) => handleUpdateSyncInterval(Number(e.target.value))}
                                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value={15000}>15 seconds</option>
                                        <option value={30000}>30 seconds</option>
                                        <option value={60000}>1 minute</option>
                                        <option value={300000}>5 minutes</option>
                                        <option value={900000}>15 minutes</option>
                                    </select>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Error Display */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                        <div className="flex items-center gap-2 text-red-800">
                            <AlertTriangle className="w-5 h-5" />
                            <span className="font-medium">Error</span>
                        </div>
                        <p className="text-sm text-red-700 mt-1">{error}</p>
                    </div>
                )}

                {/* Passphrase Form Modal */}
                {showPassphraseForm && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                            <h3 className="text-lg font-semibold mb-4">Setup Sync</h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Passphrase
                                    </label>
                                    <div className="space-y-2">
                                        <textarea
                                            value={passphrase}
                                            onChange={(e) => setPassphrase(e.target.value)}
                                            placeholder="Enter existing passphrase or generate new one"
                                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                            rows={3}
                                        />
                                        <div className="flex gap-2">
                                            <button
                                                onClick={handleGeneratePassphrase}
                                                className="flex-1 bg-gray-100 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                                            >
                                                <Key className="w-4 h-4" />
                                                Generate New Passphrase
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex space-x-3">
                                    <button
                                        onClick={() => {
                                            setShowPassphraseForm(false);
                                            setPassphrase('');
                                            setError('');
                                            setIsNewUser(false);
                                        }}
                                        className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleEnableSync}
                                        disabled={isLoading || !passphrase}
                                        className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        {isLoading ? 'Setting up...' : 'Enable Sync'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
