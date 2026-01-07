import { useEffect, useState } from 'react';
import { BaseCrudService } from '@/services/BaseCrudService';
import { OrganisationSettings, Organizations } from '@/entities';

export function useDemoMode(organisationId?: string) {
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkDemoMode = async () => {
      try {
        if (organisationId) {
          const settings = await BaseCrudService.getById<OrganisationSettings>(
            'organisationsettings',
            organisationId
          );
          setIsDemoMode(settings?.isDemoMode ?? false);
        }
      } catch (error) {
        console.error('Error checking demo mode:', error);
        setIsDemoMode(false);
      } finally {
        setLoading(false);
      }
    };

    checkDemoMode();
  }, [organisationId]);

  return { isDemoMode, loading };
}

export async function getOrganisationCount(): Promise<number> {
  try {
    const { items } = await BaseCrudService.getAll<Organizations>('organisations');
    return items.length;
  } catch (error) {
    console.error('Error getting organisation count:', error);
    return 0;
  }
}

export async function checkIfDemoMode(organisationId: string): Promise<boolean> {
  try {
    const settings = await BaseCrudService.getById<OrganisationSettings>(
      'organisationsettings',
      organisationId
    );
    return settings?.isDemoMode ?? false;
  } catch (error) {
    console.error('Error checking demo mode:', error);
    return false;
  }
}
