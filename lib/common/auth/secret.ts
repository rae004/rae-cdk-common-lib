import { merge } from 'lodash';
import { Construct } from 'constructs';
import { RemovalPolicy } from 'aws-cdk-lib';
import { Secret, SecretProps } from 'aws-cdk-lib/aws-secretsmanager';
import { AppProps } from '@/lib/common/shared/types';

export interface SecretConstructProps extends AppProps {
  secretProps?: SecretProps;
}

export class SecretConstruct extends Construct {
  readonly secret: Secret;
  constructor(scope: Construct, id: string, props: SecretConstructProps) {
    super(scope, id);

    const secretEnvName = `${props.appName}-${props.deploymentEnvironment}-secret`;

    const defaultSecretConfig: SecretProps = {
      generateSecretString: {
        excludePunctuation: true,
      },
      removalPolicy: RemovalPolicy.DESTROY,
    };

    const secretProps = merge(
      defaultSecretConfig,
      { secretName: secretEnvName },
      props?.secretProps,
    );

    this.secret = new Secret(this, secretEnvName, secretProps);
  }
}
