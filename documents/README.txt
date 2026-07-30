Drop the FINAL, client-approved SOW + MSA PDF here, merged into one file, named
to match each client's `documentPdfPath` in `lib/engagements.ts`.

For Coros: `coros-sow-msa.pdf`

This must be the actual, final version you want the client to sign — not a
draft — since the /api/sign route reads this file directly and sends it to
Documenso for signature.
