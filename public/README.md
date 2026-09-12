# public/

Static files served from the site root.

## resume.pdf

`components/scenes/Contact.tsx` links a **Résumé ↗** pill at `/resume.pdf`.
Drop the file here under exactly that name and the link goes live — nothing
else needs touching.

Until the file exists that link 404s, so if it is going to be a while, take
the pill back out of the CTA row rather than shipping a dead primary action:
a broken résumé link at the conversion point is worse than no résumé link.
