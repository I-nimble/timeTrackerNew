import { Certification } from "../models/certifications";

/**
 * Takes an array of certification objects and returns a string
 * with the certification names separated by commas.
 * Example: [{ name: 'Cert A' }, { name: 'Cert B' }, { name: '' }] => "Cert A, Cert B"
 *
 * @param certifications - Array of certification objects. Each object is expected to have a 'name' property.
 * @returns A string with filtered and joined names, or an empty string if none exist.
 */
export function getTrainingNames(certifications: Certification[] | undefined | null): string {
    if (!certifications || certifications.length === 0) {
        return '';
    }
    
    return certifications
        .map(cert => cert?.name)
        .filter((name): name is string => 
        typeof name === 'string' && name.trim() !== ''
        )
        .join(', ');
}