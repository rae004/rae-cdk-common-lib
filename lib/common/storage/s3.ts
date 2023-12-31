import { merge } from 'lodash';
import { Construct } from 'constructs';
import { RemovalPolicy } from 'aws-cdk-lib';
import {
  BlockPublicAccess,
  Bucket,
  BucketEncryption,
  BucketProps,
} from 'aws-cdk-lib/aws-s3';
import { AppProps } from '@/lib/common/shared/types';

interface s3ConstructsProps extends AppProps {
  s3BucketProps?: BucketProps;
}

const defaultS3BucketConfig: BucketProps = {
  encryption: BucketEncryption.S3_MANAGED,
  blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
  enforceSSL: true,
  removalPolicy: RemovalPolicy.DESTROY,
  autoDeleteObjects: true,
};
export class s3Construct extends Construct {
  readonly bucket: Bucket;
  constructor(scope: Construct, id: string, props: s3ConstructsProps) {
    super(scope, id);

    const appName = `${props.appName}-${props.deploymentEnvironment}`;

    const bucketName = props?.s3BucketProps?.bucketName
      ? `${appName}-${props.s3BucketProps.bucketName}-bucket`
      : `${appName}-bucket`;

    const s3Props = merge(defaultS3BucketConfig, props?.s3BucketProps, {
      bucketName: bucketName,
    });

    this.bucket = new Bucket(this, `${appName}-s3-bucket`, s3Props);
  }
}
