import { FieldMapping, ParsedFileData, ContactField } from '@/types';

const CORE_FIELDS = [
  { key: 'firstName', labels: ['first name', 'firstname', 'fname', 'given name', 'forename'] },
  { key: 'lastName', labels: ['last name', 'lastname', 'lname', 'surname', 'family name'] },
  { key: 'phone', labels: ['phone', 'mobile', 'cell', 'telephone', 'tel', 'phone number', 'mobile number'] },
  { key: 'email', labels: ['email', 'e-mail', 'email address', 'mail'] },
  { key: 'agentUid', labels: ['agent', 'assigned agent', 'agent email', 'agent email address', 'assigned to'] },
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[\d\s\-\+\(\)]+$/;

export function detectFieldType(value: string): 'email' | 'phone' | 'text' | 'number' | 'datetime' | null {
  if (!value || typeof value !== 'string') return null;
  
  const trimmed = value.trim();
  
  if (EMAIL_REGEX.test(trimmed)) {
    return 'email';
  }
  
  if (PHONE_REGEX.test(trimmed) && /\d/.test(trimmed) && trimmed.length >= 7) {
    return 'phone';
  }
  
  const datePatterns = [
    /^\d{4}-\d{2}-\d{2}/,
    /^\d{2}\/\d{2}\/\d{4}/,
    /^\d{2}-\d{2}-\d{4}/,
  ];
  if (datePatterns.some(pattern => pattern.test(trimmed))) {
    return 'datetime';
  }
  
  if (!isNaN(Number(trimmed)) && trimmed !== '') {
    return 'number';
  }
  
  return 'text';
}

export function calculateHeaderSimilarity(header: string, targetLabels: string[]): number {
  const normalizedHeader = header.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
  
  let maxScore = 0;
  
  for (const label of targetLabels) {
    const normalizedLabel = label.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
    
    if (normalizedHeader === normalizedLabel) {
      return 1.0;
    }
    
    if (normalizedHeader.includes(normalizedLabel) || normalizedLabel.includes(normalizedHeader)) {
      maxScore = Math.max(maxScore, 0.8);
    }
    
    const longer = normalizedHeader.length > normalizedLabel.length ? normalizedHeader : normalizedLabel;
    const shorter = normalizedHeader.length > normalizedLabel.length ? normalizedLabel : normalizedHeader;
    
    if (longer.includes(shorter)) {
      const similarity = shorter.length / longer.length;
      maxScore = Math.max(maxScore, similarity * 0.7);
    }
  }
  
  return maxScore;
}

export function suggestFieldMappings(
  fileData: ParsedFileData,
  customFields: ContactField[] = []
): FieldMapping[] {
  const mappings: FieldMapping[] = [];
  const usedSystemFields = new Set<string>();
  
  for (const header of fileData.headers) {
    let bestMatch: { field: string; confidence: number } | null = null;
    
    for (const coreField of CORE_FIELDS) {
      const similarity = calculateHeaderSimilarity(header, coreField.labels);
      if (similarity > 0.3 && (!bestMatch || similarity > bestMatch.confidence)) {
        bestMatch = { field: coreField.key, confidence: similarity };
      }
    }
    
    for (const customField of customFields) {
      const similarity = calculateHeaderSimilarity(header, [customField.label]);
      if (similarity > 0.3 && (!bestMatch || similarity > bestMatch.confidence)) {
        bestMatch = { field: customField.id, confidence: similarity };
      }
    }
    
    if (bestMatch && !usedSystemFields.has(bestMatch.field)) {
      mappings.push({
        fileColumn: header,
        systemField: bestMatch.field,
        confidence: bestMatch.confidence,
      });
      usedSystemFields.add(bestMatch.field);
    }
  }
  
  const unmappedHeaders = fileData.headers.filter(
    h => !mappings.some(m => m.fileColumn === h)
  );
  
  for (const header of unmappedHeaders) {
    const sampleValues = fileData.rows
      .map(row => row[header])
      .filter(val => val !== null && val !== undefined && val !== '')
      .slice(0, 5)
      .map(String);
    
    if (sampleValues.length === 0) continue;
    
    const detectedType = detectFieldType(sampleValues[0]);
    
    if (detectedType === 'email' && !usedSystemFields.has('email')) {
      mappings.push({
        fileColumn: header,
        systemField: 'email',
        confidence: 0.9,
      });
      usedSystemFields.add('email');
    } else if (detectedType === 'phone' && !usedSystemFields.has('phone')) {
      mappings.push({
        fileColumn: header,
        systemField: 'phone',
        confidence: 0.9,
      });
      usedSystemFields.add('phone');
    } else {
      const matchingCustomField = customFields.find(
        cf => cf.type === detectedType && !usedSystemFields.has(cf.id)
      );
      
      if (matchingCustomField) {
        mappings.push({
          fileColumn: header,
          systemField: matchingCustomField.id,
          confidence: 0.7,
        });
        usedSystemFields.add(matchingCustomField.id);
      }
    }
  }
  
  return mappings;
}

export async function suggestFieldMappingsWithAI(
  fileData: ParsedFileData,
  customFields: ContactField[] = []
): Promise<FieldMapping[]> {
  const internalFields: Array<{ key: string; label: string }> = [];
  
  for (const coreField of CORE_FIELDS) {
    internalFields.push({
      key: coreField.key,
      label: coreField.labels[0],
    });
  }
  
  for (const customField of customFields) {
    internalFields.push({
      key: customField.id,
      label: customField.label,
    });
  }

  const firstRow = fileData.rows[0] || {};
  const sampleData = [firstRow];

  try {
    const response = await fetch('/api/ai-mapping', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sampleData,
        headers: fileData.headers,
        internalFields,
      }),
    });

    if (!response.ok) {
      throw new Error('AI mapping failed');
    }

    const aiMapping: Record<string, string> = await response.json();

    const mappings: FieldMapping[] = [];
    const usedSystemFields = new Set<string>();
    const coreFieldKeys = CORE_FIELDS.map(f => f.key);
    const customFieldIds = customFields.map(f => f.id);

    for (const [csvColumn, systemField] of Object.entries(aiMapping)) {
      const isValidField = 
        coreFieldKeys.includes(systemField) || 
        customFieldIds.includes(systemField);

      if (isValidField && !usedSystemFields.has(systemField)) {
        mappings.push({
          fileColumn: csvColumn,
          systemField: systemField,
          confidence: 0.95,
        });
        usedSystemFields.add(systemField);
      }
    }

    const unmappedHeaders = fileData.headers.filter(
      h => !mappings.some(m => m.fileColumn === h)
    );

    if (unmappedHeaders.length > 0) {
      const unmappedData: ParsedFileData = {
        headers: unmappedHeaders,
        rows: fileData.rows,
      };
      const fallbackMappings = suggestFieldMappings(unmappedData, customFields);
      
      for (const mapping of fallbackMappings) {
        if (!usedSystemFields.has(mapping.systemField)) {
          mappings.push(mapping);
          usedSystemFields.add(mapping.systemField);
        }
      }
    }

    return mappings;
  } catch (error) {
    console.error('AI mapping error, falling back to regular mapping:', error);
    return suggestFieldMappings(fileData, customFields);
  }
}
