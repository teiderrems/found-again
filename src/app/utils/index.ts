
export const extractIntegerFromIRI = (iri: string): number | null => {
    // Regular expression to find a single number in the IRI
    const iriRegex = /\/(\d+)\//;
    const match = iri.match(iriRegex);
    if (!match) return null;

    // Extracted substring containing the number
    const extractedNumber = match[1];

    // Convert the extracted substring to an integer
    return parseInt(extractedNumber, 10);
};

// Function to check if a string is a valid UUID
const isUUID = (str: string): boolean => {
    const uuidRegex =
        /[0-9a-f]{8}-[0-9a-f]{4}-[1-7][0-9a-f]{3}-[0-9a-f]{4}-[0-9a-f]{12}/i;

    return uuidRegex.test(str);
};
export const capitalizeFirstLetter = (word?: string) => {
    if (typeof word !== 'string') {
        return '';
    }
    return word.charAt(0).toUpperCase() + word.slice(1);
};

export * from './preparePathForRouter';
export * from './truncate';
export * from './generateUrl';
