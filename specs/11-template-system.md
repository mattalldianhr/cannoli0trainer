# Spec: Reusable Program Templates

## Job to Be Done
Allow the coach to save program structures as templates and reuse them across athletes — directly reducing the 10-15 hours/week spent on programming by not rebuilding common program patterns from scratch.

## Requirements
- Save any program as a template
- Template library at `/programs/templates`
- Create new program from template
- Templates preserve: structure (weeks, days), exercises, prescription types, set/rep schemes
- Templates do NOT preserve: specific loads (since they differ per athlete)
- Duplicate template to create a variation
- Template metadata: name, description, periodization type, target athlete level, duration
- Template search and filter

## Acceptance Criteria
- [ ] "Save as Template" button on any program
- [ ] `/programs/templates` lists all saved templates
- [ ] Templates show metadata (name, duration, periodization type)
- [ ] "Use Template" creates new program from template structure
- [ ] New program from template copies weeks/days/exercises but not athlete-specific loads
- [ ] Can duplicate a template to create variations
- [ ] Search templates by name
- [ ] Filter templates by periodization type
- [ ] Delete template with confirmation

## Test Cases
| Input | Expected Output |
|-------|-----------------|
| Save 8-week block periodization as template | Template created with all weeks/days/exercises |
| Create program from template | New program with identical structure, no loads |
| Duplicate template | Copy created with "(Copy)" appended to name |
| Search "hypertrophy" | Templates with "hypertrophy" in name shown |
| Delete template | Removed from list, existing programs using it unchanged |

## Technical Notes
- Program model already has `isTemplate` boolean and `type` enum
- Template creation: deep copy of program structure without athlete-specific data
- Use Prisma transactions for atomic template creation (copy program + workouts + exercises)
- Template listing reuses program list components with filter for isTemplate=true
- This builds on the program builder spec
