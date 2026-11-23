# Security

## Reporting

Email `security@example.com` with a description, a tape if one is involved, and
the `rewind` version. Expect an acknowledgement within three working days.

## Scope

In scope: chain verification bypasses, replay reaching the live network,
preload escaping the boundary, tape path traversal, shell injection through
`run_shell` arguments.

Out of scope: the security of the agent under test, the security of the model
provider, and anything requiring write access to the repository.
