# Government Contract Opportunity Survey

Standalone market-research website created by Apropos Group LLC to gather feedback on the challenges businesses face when discovering, evaluating, and pursuing government contract opportunities.

## Purpose

The website presents a purpose-driven, mobile-first survey without disclosing proprietary product methods, matching logic, technical architecture, or internal business workflows.

The research measures:

- respondent type and government markets of interest
- government-contracting experience
- common opportunity-discovery and pursuit challenges
- current contract-search methods
- interest in relevant opportunity discovery
- interest in opportunity-fit evaluation
- potential demand for professional Contract Proposal Development
- optional follow-up interest

## Included Files

- `index.html` — hero, participation assurances, nine-question survey, optional follow-up, About/Community Purpose section
- `styles.css` — responsive desktop and mobile design
- `survey.js` — multi-step navigation, validation, character count, contact-consent logic, and campaign-source tracking
- `thank-you.html` — approved community-purpose thank-you experience and survey-sharing control
- `privacy.html` — survey-specific privacy notice
- `netlify.toml` — publish settings, pretty URL routes, and security headers

## Netlify Deployment

1. Create a new Netlify project from this GitHub repository.
2. Select the `main` branch.
3. Leave the build command blank.
4. Set the publish directory to `.` if Netlify does not detect it automatically.
5. Deploy the site.
6. Open **Forms** in Netlify after the first production deployment and confirm that `government-contract-opportunity-survey` appears.
7. Submit one test response and verify that it appears in the Netlify Forms dashboard and redirects to `/thank-you`.

The survey uses Netlify's native static-form handling. No external database or API key is required for the initial campaign.

## Campaign Tracking Links

Use one survey URL with a different source parameter for each outreach channel:

```text
/?source=linkedin
/?source=facebook
/?source=tiktok
/?source=instagram
/?source=email
/?source=partner
/?source=qr
```

Optional UTM values are also stored:

```text
/?source=linkedin&utm_campaign=launch&utm_content=founder-post
```

## Privacy and Competitive Protection

The public survey focuses on user problems, desired outcomes, and professional-service interest. It does not disclose:

- contract-matching methods
- opportunity-ranking or scoring logic
- fit-analysis methodology
- data-combination methods
- internal AI instructions or workflows
- technical architecture
- lead-qualification logic
- pricing strategy
- future product roadmap

## Source of Truth

Research conducted by Apropos Group LLC.

**Businesses grow. People prosper. Communities become stronger.**
