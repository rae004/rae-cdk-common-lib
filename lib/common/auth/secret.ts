import { merge } from 'lodash';
import { Construct } from 'constructs';
import { RemovalPolicy } from 'aws-cdk-lib';
import { Secret, SecretProps } from 'aws-cdk-lib/aws-secretsmanager';

export interface SecretConstructProps {
  secretProps: SecretProps;
}

const defaultSecretConfig: SecretProps = {
  generateSecretString: {
    excludePunctuation: true,
  },
  removalPolicy: RemovalPolicy.DESTROY,
};
export class SecretConstruct extends Construct {
  readonly secret: Secret;
  constructor(scope: Construct, id: string, props?: SecretConstructProps) {
    super(scope, id);

    const secretProps = merge(defaultSecretConfig, props?.secretProps);

    this.secret = new Secret(this, 'wp-secret-manager', secretProps);
  }
}
