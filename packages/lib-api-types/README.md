# `@openshift/dynamic-plugin-sdk-types`

> TypeScript types generated from OpenShift and Kubernetes APIs.

## Package structure

```
dist/
  index.d.ts           # Entry point — re-exports everything
  k8s-common.d.ts      # Base K8s interfaces (K8sResourceCommon, ObjectMetadata, OwnerReference, etc.)
  build-metadata.json  # Build info (version, date, source commits)

  kubernetes/          # Types generated from the OpenShift fork of the Kubernetes API swagger spec
    index.d.ts         # Namespace re-exports for all API groups
    all.d.ts           # Every type with version-qualified names (e.g. CoreV1PodKind)
    latest.d.ts        # Latest version of each type (e.g. PodKind)
    <group>/           # API group (e.g. core, apps, batch, networking.k8s.io)
      <version>/       # API version (e.g. v1, v1beta1)
        <Kind>.d.ts    # One file per resource kind (e.g. Pod.d.ts, Deployment.d.ts)

  openshift/           # Types generated from OpenShift CRD schemas
    index.d.ts         # Namespace re-exports for all API groups
    all.d.ts           # Every type with version-qualified names
    latest.d.ts        # Latest version of each type
    <group>/           # API group (e.g. config.openshift.io, console.openshift.io)
      <version>/       # API version (e.g. v1, v1alpha1)
        <Kind>.d.ts    # One file per CRD kind (e.g. Route.d.ts, ConsolePlugin.d.ts)
```

All generated types extend `K8sResourceCommon` and are organized by platform, API group, and version. Each resource kind gets its own `.d.ts` file with a `<Kind>Kind` interface name (e.g. `PodKind`, `DeploymentKind`).

## Source commits

The upstream git commits used for type generation are tracked in [`sources.json`](./sources.json):

- `openshift/api` — OpenShift CRD definitions
- `openshift/kubernetes` — Kubernetes API swagger spec
