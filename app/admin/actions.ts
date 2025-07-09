'use server';

import { toggleApiKeyStatus, deleteApiKey } from 'app/db';

export async function toggleApiKeyAction(keyId: number) {
  await toggleApiKeyStatus(keyId, 0); // 0 means admin operation
}

export async function deleteApiKeyAction(keyId: number) {
  await deleteApiKey(keyId, 0); // 0 means admin deletion
} 