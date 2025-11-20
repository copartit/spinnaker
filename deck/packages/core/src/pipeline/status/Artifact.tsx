import React from 'react';

import { ArtifactIconService } from '../../artifact';
import type { IArtifact } from '../../domain';
import { CopyToClipboard } from '../../utils';

import './artifact.less';

export interface IArtifactProps {
  artifact: IArtifact;
  isDefault?: boolean;
  sequence?: number;
}

export class Artifact extends React.Component<IArtifactProps> {
  private tooltip(artifact: IArtifact, isDefault: boolean): string {
    const tooltipEntries = [];
    if (isDefault) {
      tooltipEntries.push('Default Artifact');
    }
    if (artifact.name) {
      tooltipEntries.push(`Name: ${artifact.name}`);
    }
    if (artifact.type) {
      tooltipEntries.push(`Type: ${artifact.type}`);
    }
    if (artifact.version) {
      tooltipEntries.push(`Version: ${artifact.version}`);
    }
    if (artifact.reference) {
      tooltipEntries.push(`Reference: ${artifact.reference}`);
    }
    return tooltipEntries.join('\n');
  }

  private artifactDelimiter(artifact: IArtifact): string {
    switch (artifact.type) {
      case 'docker/image':
        return ':';
      default:
        return ' - ';
    }
  }

  public render() {
    const { artifact, isDefault } = this.props;
    const { name, reference, version, type } = artifact;
    const artifactName = `${name || reference}${this.artifactDelimiter(artifact)}${version || 'latest'}`;
    const copyToClipboardText = this.artifactDelimiter(artifact) === ':' ? artifactName : '';

    return (
      <div className="artifact-details">
        <dl title={this.tooltip(artifact, isDefault)}>
          <div className="artifact-detail">
            <dt>
              {ArtifactIconService.getPath(type) ? (
                <img
                  className="artifact-icon"
                  alt={type}
                  src={ArtifactIconService.getPath(type)}
                  width="36"
                  height="36"
                />
              ) : (
                <span>[{type}] </span>
              )}
            </dt>
            <dd>
              <pre>
                {artifactName}
                {copyToClipboardText && <CopyToClipboard text={copyToClipboardText} toolTip="Copy to clipboard" />}
              </pre>
            </dd>
          </div>
        </dl>
      </div>
    );
  }
}
