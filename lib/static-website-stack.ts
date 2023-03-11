import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3Deployment from 'aws-cdk-lib/aws-s3-deployment'
import * as route53 from 'aws-cdk-lib/aws-route53'

export class StaticWebsiteStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const recordName = 'static-website-example';
    const siteDomainName = 'thomaswimprine.com';
    const webAssetDirectory = 'web-content';

    const webBucket = new s3.Bucket(this, 'webbucket', {
      bucketName: [recordName, siteDomainName].join('.'),     // Bucket name needs to match the website DNS 
      publicReadAccess: true,                                 // Enables public access for a website
      removalPolicy: cdk.RemovalPolicy.DESTROY,               // When we update it's actually a delete and replace
      autoDeleteObjects: true,                                // Don't ask us for permission just do it 
      websiteIndexDocument: 'index.html'                      // Entry file for the site
    });

    // Copy the web assets to the S3 bucket
    new s3Deployment.BucketDeployment(this, "deployStaticWebsite", {
      sources: [s3Deployment.Source.asset(webAssetDirectory)],
      destinationBucket: webBucket,
    });

    // redirect the root domain bucket to the www bucket
    // const redirectBucket = new s3.Bucket(this, "redirectBucket", {
    //   bucketName: siteDomainName,                                             // defines the name of the bucket 
    //   websiteRedirect: { hostName: [recordName, siteDomainName].join('.') }   // Redirects 'mydomain.com'
    // });

    // Get the DNS base zone to update the record in the next step
    const zone = route53.HostedZone.fromLookup(this, 'baseZone', {
      domainName: siteDomainName
    });

    new route53.ARecord(this, 'AliasRecord', {
      zone,                             // mydomain.com
      recordName,                       // www
      // creates the target record with the bucket information
      target: route53.RecordTarget.fromAlias(new cdk.aws_route53_targets.BucketWebsiteTarget(webBucket)),
    });

  }
}
