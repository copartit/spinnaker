import { isString } from 'lodash';
import React from 'react';

import { ArtifactIconService } from '../ArtifactIconService';
import { ArtifactTypePatterns } from '../ArtifactTypes';
import type { IArtifact } from '../../domain';
import { CopyToClipboard } from '../../utils';

export interface IArtifactIconListProps {
  artifacts: IArtifact[];
}

function artifactDelimiter(artifact: IArtifact): string {
  switch (artifact.type) {
    case 'docker/image':
      return ':';
    default:
      return ' - ';
  }
}
export const ArtifactIconList = (props: IArtifactIconListProps): any => {
  return props.artifacts.map((artifact, i) => {
    const { location, reference, type } = artifact;
    let { name } = artifact;
    const iconPath = ArtifactIconService.getPath(type);
    const key = `${location || ''}${type || ''}${reference || ''}` || String(i);
    let artifactName = `${name || reference}${artifact.version ? artifactDelimiter(artifact) + artifact.version : ''}`;
    let title = artifactName;
    const copyToClipboardText = artifactDelimiter(artifact) === ':' ? artifactName : '';
    if (isString(type) && type.length > 0) {
      const k8sKindMatch = type.match(ArtifactTypePatterns.KUBERNETES);
      if (k8sKindMatch != null && k8sKindMatch[1].length > 0) {
        const kind = k8sKindMatch[1].substr(0, 1).toUpperCase() + k8sKindMatch[1].substr(1);
        name = `${kind} ${name}`;
        title = name;
        artifactName = `${name || reference}${artifact.version ? artifactDelimiter(artifact) + artifact.version : ''}`;
      }
    }
    return (
      <div className="artifact-list-row">
        <div key={key} className="artifact-list-item" title={title}>
          {iconPath && <img className="artifact-list-item-icon" width="20" height="20" src={iconPath} />}
          <span className="artifact-list-item-name">{artifactName}</span>
        </div>
        {copyToClipboardText && <CopyToClipboard text={copyToClipboardText} toolTip="Copy to clipboard" />}
      </div>
    );
  });
};
