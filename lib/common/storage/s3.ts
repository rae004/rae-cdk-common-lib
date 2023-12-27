import { merge } from 'lodash';
import { Construct } from 'constructs';
import { RemovalPolicy } from 'aws-cdk-lib';
import {
  BlockPublicAccess,
  Bucket,
  BucketEncryption,
  BucketProps,
} from 'aws-cdk-lib/aws-s3';

const defaultS3BucketConfig = {
  encryption: BucketEncryption.S3_MANAGED,
  blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
  enforceSSL: true,
  removalPolicy: RemovalPolicy.DESTROY,
  autoDeleteObjects: true,
};
export class s3Construct extends Construct {
  readonly bucket: Bucket;
  constructor(scope: Construct, id: string, props?: BucketProps) {
    super(scope, id);

    props = merge(defaultS3BucketConfig, props);

    this.bucket = new Bucket(this, 's3-bucket', props);
  }
}
