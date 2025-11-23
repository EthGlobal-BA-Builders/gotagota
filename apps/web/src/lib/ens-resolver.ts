import { createPublicClient, http, type Address } from 'viem';
import { celo, celoAlfajores } from 'viem/chains';

/**
 * Check if a string is likely an ENS name (contains .celo or .eth TLD)
 */
export function isENSName(input: string): boolean {
  if (!input || typeof input !== 'string') return false;
  const trimmed = input.trim().toLowerCase();
  return trimmed.endsWith('.celo') || trimmed.endsWith('.eth');
}

/**
 * Check if a string is a valid Ethereum address
 */
export function isValidAddress(input: string): boolean {
  if (!input || typeof input !== 'string') return false;
  return /^0x[a-fA-F0-9]{40}$/.test(input.trim());
}

/**
 * Resolve ENS name to address
 * Supports both .celo and .eth domains
 */
export async function resolveENS(
  name: string,
  chainId: number = celoAlfajores.id
): Promise<Address | null> {
  if (!name || typeof name !== 'string') {
    return null;
  }

  const trimmed = name.trim();
  
  // If it's already an address, return it
  if (isValidAddress(trimmed)) {
    return trimmed as Address;
  }

  // If it's not an ENS name, return null
  if (!isENSName(trimmed)) {
    return null;
  }

  try {
    // Use the appropriate chain based on chainId
    const chain = chainId === celo.id ? celo : celoAlfajores;
    
    const publicClient = createPublicClient({
      chain,
      transport: http(),
    });

    // Resolve ENS name to address
    // Note: getEnsAddress may not work for all ENS providers
    // For Celo-specific ENS, you might need a different resolver
    const address = await publicClient.getEnsAddress({
      name: trimmed.toLowerCase(),
    });

    if (!address) {
      console.warn(`Could not resolve ENS name: ${trimmed}`);
      return null;
    }

    return address;
  } catch (error) {
    console.error(`Failed to resolve ENS name ${trimmed}:`, error);
    // Return null instead of throwing, so the process can continue
    return null;
  }
}

/**
 * Resolve multiple ENS names/addresses to addresses
 * Returns a map of original input to resolved address
 */
export async function resolveMultipleENS(
  inputs: string[],
  chainId: number = celoAlfajores.id
): Promise<Map<string, Address | null>> {
  const results = new Map<string, Address | null>();
  
  // Resolve all in parallel
  const promises = inputs.map(async (input) => {
    const resolved = await resolveENS(input, chainId);
    return { input, resolved };
  });

  const resolved = await Promise.all(promises);
  
  resolved.forEach(({ input, resolved }) => {
    results.set(input, resolved);
  });

  return results;
}

