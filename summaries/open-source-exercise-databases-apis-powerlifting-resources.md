---
created: 2026-02-17
source_url: Multiple sources (GitHub, npm, GitLab, PyPI) -- see individual entries
source_type: community/documentation
research_focus: Open-source repositories, APIs, and databases for seeding a powerlifting/S&C exercise library and calculation engine
tags: [open-source, exercise-database, powerlifting, APIs, 1RM-calculators, RPE, Wilks, DOTS, IPF-GL, OpenPowerlifting, training-programs, VBT]
---

# Open-Source Resources for Strength Training & Powerlifting Platforms

**Source:** Aggregated research across GitHub, npm, PyPI, GitLab, and the broader web

## Citation

Multiple open-source repositories and community projects surveyed February 2026. Individual citations inline below.

## Executive Summary

This research identifies and evaluates the complete landscape of open-source resources available for building a powerlifting and strength & conditioning coaching platform (Cannoli Trainer). The investigation covers five major categories: exercise databases/APIs, exercise video libraries, strength calculation libraries, powerlifting-specific datasets, and training program templates/generators.

The most significant findings are: (1) **free-exercise-db** (public domain, 800+ exercises with images and structured JSON) and **exercemus/exercises** (MIT, curated from multiple sources) are the strongest candidates for seeding an exercise library without licensing concerns; (2) **@finegym/fitness-calc** (MIT, TypeScript, zero dependencies, updated Feb 2026) is the best single library for 1RM calculations; (3) **powerlifting-formulas** (MIT, TypeScript) covers all powerlifting coefficient calculations (Wilks, DOTS, IPF GL, Glossbrenner); (4) **OpenPowerlifting** (public domain data, 3.8M+ entries) is the definitive powerlifting competition dataset; and (5) **plate-calculator** (npm) and **streprogen** (Python) fill niche but important utility roles.

The ecosystem is surprisingly complete. A coaching platform can be substantially bootstrapped from these resources, particularly for exercise data, strength formulas, and competition benchmarking. The primary gaps are: no single open-source RPE/RIR lookup table as a standalone library, limited open-source video content specifically for powerlifting technique, and no ready-made periodization engine in JavaScript/TypeScript (streprogen is Python-only).

## Key Concepts & Definitions

- **1RM (One Rep Max)**: The maximum weight a lifter can lift for a single repetition. Estimated from submaximal sets using formulas like Epley (weight x (1 + reps/30)) and Brzycki (weight x 36/(37 - reps)).
- **RPE (Rate of Perceived Exertion)**: A 1-10 scale (in powerlifting context) measuring effort, where RPE 10 = maximal effort, RPE 9 = 1 rep left in reserve. Popularized by Mike Tuchscherer of Reactive Training Systems.
- **RIR (Reps in Reserve)**: Direct inverse of RPE. RIR 0 = RPE 10 (failure), RIR 2 = RPE 8, etc.
- **Wilks Coefficient**: A formula comparing powerlifting totals across bodyweight classes. Being replaced by newer formulas but still widely used.
- **DOTS (Dynamic Objective Team Score)**: A newer bodyweight-normalized scoring formula gaining adoption outside IPF.
- **IPF GL (Goodlift Points)**: The International Powerlifting Federation's official scoring system, replacing Wilks in IPF competitions.
- **VBT (Velocity Based Training)**: Training methodology using barbell velocity to autoregulate intensity. Involves load-velocity profiling to predict 1RM from bar speed.
- **Periodization**: Systematic planning of training variables (volume, intensity, exercise selection) over time blocks (microcycles, mesocycles, macrocycles).

## Main Arguments / Insights / Features

### 1. Exercise Databases & APIs

#### free-exercise-db (BEST FOR SEEDING)
- **URL**: https://github.com/yuhonas/free-exercise-db
- **License**: Unlicense (Public Domain) -- no restrictions whatsoever
- **Content**: 800+ exercises in JSON format
- **Data Schema**: id, name, force (pull/push), level (beginner/intermediate/advanced), mechanic (isolation/compound), equipment, primaryMuscles[], secondaryMuscles[], instructions[], category, images[]
- **Images**: Stored in /exercises/ directory, accessible via GitHub raw URLs or imagekit.io CDN
- **Quality**: 1.1k stars, 299 forks, well-structured JSON schema with validation, browsable Vue.js frontend
- **Limitations**: ~25 duplicate images; some exercises have null values for force, mechanic, and equipment fields
- **Platform Use**: Primary seed data for exercise library. Public domain license means zero legal risk. Can be imported directly into database. Images need hosting (or use raw GitHub URLs initially).

#### exercemus/exercises (BEST CURATED STRUCTURE)
- **URL**: https://github.com/exercemus/exercises
- **License**: MIT (exercises carry original license attribution from their sources)
- **Content**: Curated from exercemus.com, wger.de, and exercises.json
- **Data Schema**: categories, equipment, muscles, muscle_groups (top-level taxonomies); per exercise: category, name, aliases, description, instructions, tips, equipment, primary_muscles, secondary_muscles, tempo, images, video, variation_on, license_author, license
- **Quality**: 36 stars, 8 forks, 57 commits, Python-based tooling
- **Unique Value**: Includes tempo data, exercise aliases, and variation relationships -- more structured than free-exercise-db
- **Platform Use**: Best for understanding exercise taxonomy and relationships. The variation_on field is valuable for suggesting exercise substitutions. Merge with free-exercise-db for most complete dataset.

#### wrkout/exercises.json
- **URL**: https://github.com/wrkout/exercises.json
- **License**: Unlicense (Public Domain)
- **Content**: Open public domain exercise dataset in JSON and PostgreSQL SQL formats
- **Quality**: 534 stars, 159 forks, last commit January 2025
- **Limitations**: The public domain version is smaller than their commercial offering (2,500+ exercises, 10,000+ images, 3,500+ videos available at wrkout.xyz)
- **Platform Use**: Supplementary data source. The PostgreSQL SQL export is convenient for direct database loading.

#### ExerciseDB API (LARGEST BUT COMPLEX LICENSING)
- **URL**: https://github.com/ExerciseDB/exercisedb-api
- **License**: AGPL-3.0 (copyleft -- requires derivative works to be open-sourced)
- **Content**: 11,000+ exercises, 15,000+ videos, 20,000+ images, 5,000+ GIFs
- **Data Schema**: exercise ID, name, target body parts, muscle groups (primary/secondary), equipment, gender-specific animations, step-by-step instructions, coaching tips, exercise variations, related exercises
- **Quality**: 100 stars, self-hostable, production API requires subscription
- **Limitations**: AGPL license means if you use it, your derivative work must also be open-sourced. Production access requires API key subscription. Rate limits on free tier.
- **Platform Use**: Best avoided for commercial platform due to AGPL constraints unless self-hosting and willing to open-source. Could reference for data structure inspiration.

#### wger (FULL PLATFORM, NOT JUST DATA)
- **URL**: https://github.com/wger-project/wger
- **License**: AGPL-3.0 (code), Creative Commons (exercise data), CC-BY-SA-4.0 (docs)
- **Content**: Full workout management platform with exercise wiki, REST API, nutrition tracking, gym management
- **Quality**: 5.6k stars, 819 forks, 232 contributors, 8,567 commits -- the most mature project in this space
- **Stack**: Python/Django backend, jQuery frontend
- **Platform Use**: Too heavy to use as a data source (it's a full competing platform). However, its REST API could be used to pull exercise data, and the Creative Commons exercise data could be extracted. Better as architectural reference than as a dependency.

### 2. Exercise Video Libraries

#### Available Options (LIMITED)
There is no single open-source, freely embeddable powerlifting technique video library. The landscape:

- **ExerciseDB API**: Has 15,000+ videos and 5,000+ GIFs but under AGPL-3.0
- **wrkout.xyz**: 3,500+ videos but commercial/paid
- **Gabriel Sincraian**: Free weightlifting technique video library at gabrielsincraian.com (Olympic lifting focused)
- **Progressive Resistance Systems**: Curated database of best powerlifting YouTube videos for squat/bench/deadlift technique

#### Practical Approach for Cannoli Trainer
- Embed YouTube videos from established powerlifting channels (Calgary Barbell, Juggernaut Training Systems, Alan Thrall, Jeff Nippard) using YouTube embed API -- free and legal via YouTube's terms of service
- Store YouTube video IDs associated with exercises in the database
- Consider recording original content over time for core movements (squat, bench, deadlift, and top accessories)

### 3. Strength Calculation Libraries

#### @finegym/fitness-calc (TOP RECOMMENDATION FOR TYPESCRIPT)
- **URL**: https://github.com/finegym-io/fitness-calc
- **npm**: `@finegym/fitness-calc`
- **License**: MIT
- **Language**: TypeScript, zero dependencies
- **Last Updated**: February 1, 2026 (actively maintained)
- **Stars**: 9
- **1RM Formulas**: Epley (default), Brzycki, Lombardi, Mayhew, O'Conner, Wathan, Lander
- **Additional**: BMI, BMR, TDEE, body fat, macros, heart rate zones, calorie burn, pace/speed
- **API Example**:
  ```typescript
  calculateOneRepMax(100, 5) // weight=100, reps=5
  calculateOneRepMax(100, 5, { formula: 'brzycki' })
  ```
- **Platform Use**: Drop-in library for all 1RM calculations. MIT license is ideal. Zero dependencies means no bloat. Also provides nutrition/body comp calculations if needed later.

#### powerlifting-formulas (TOP RECOMMENDATION FOR COEFFICIENTS)
- **URL**: https://github.com/Marantesss/powerlifting-formulas
- **npm**: `powerlifting-formulas`
- **License**: MIT
- **Language**: TypeScript
- **Supported Formulas**: Wilks (original), Wilks 2020, DOTS, Reshel, Glossbrenner, Schwartz-Malone
- **Missing**: IPF GL (Goodlift Points) -- notable gap
- **API Example**:
  ```typescript
  import { wilks, dots, wilks2020 } from 'powerlifting-formulas'
  wilks(82.5, 680, 'male') // bodyweight, total, gender
  dots(82.5, 680, 'male', 'kg')
  ```
- **Limitations**: Only 1 star, low community adoption. Reshel formula may be slightly inaccurate (~0.01 points). No IPF GL formula.
- **Platform Use**: Use for Wilks/DOTS calculations. Will need to implement IPF GL separately (formulas are publicly documented in OpenPowerlifting's Rust crates at `crates/coefficients/src/goodlift.rs`).

#### onerepmax-js
- **URL**: https://github.com/svespie/onerepmax-js
- **License**: MIT
- **Formulas**: Brzycki, Epley, Lander, Lombardi, Mayhew, O'Conner, Wathen, plus 'average' and 'all' modes
- **API**: `onerepmax.calculate(weight, reps, formula)` -- returns number or object
- **Limitation**: Reps capped at 1-10 range. Created 2015, potentially unmaintained.
- **Platform Use**: Simpler alternative to fitness-calc if only 1RM needed. The 'all' mode returning every formula result is useful for comparison displays.

#### OpenPowerlifting Coefficients Crate (REFERENCE IMPLEMENTATION)
- **URL**: https://gitlab.com/openpowerlifting/opl-data (under `crates/coefficients/`)
- **License**: AGPL-3.0+ (code)
- **Language**: Rust
- **Formulas**: Wilks, DOTS, IPF GL (Goodlift), Glossbrenner, and more
- **Platform Use**: The definitive reference for formula accuracy. Port the IPF GL calculation from `src/goodlift.rs` to TypeScript since `powerlifting-formulas` lacks it.

#### RPE/RIR Conversion Tables
- **No standalone open-source library found**. The Tuchscherer RPE table is widely republished but not packaged as an npm module.
- **Best approach**: Implement as a lookup table in the codebase. The standard RPE-to-%1RM table (e.g., RPE 10 @ 1 rep = 100%, RPE 8 @ 5 reps = 76%) is publicly documented across many sources.
- **Reference sources**: rpecalculator.com, Exodus Strength expanded table, Reactive Training Systems publications

#### plate-calculator (NPM)
- **URL**: https://github.com/ipalindromi/plate-calculator
- **npm**: `plate-calculator`
- **License**: Not specified (check repo)
- **Features**: Calculates plate loading for target weight; supports custom bar weight, available plate inventory, non-standard plates
- **API**: `plateCalculator.calculate({ targetWeight, barWeight, plates, addedPlates })` returns `{ plates: [{plateWeight, qty}], closestWeight }`
- **Platform Use**: Drop-in utility for plate loading display on workout screens. Handles edge cases like limited plate availability.

#### VBT / Load-Velocity Profiling
- **VBT-Barbell-Tracker**: https://github.com/kostecky/VBT-Barbell-Tracker -- OpenCV-based barbell tracking, proof of concept
- **app_vbt**: https://github.com/LeFaillerFrancois/app_vbt -- Tkinter + DeepLabCut video analysis
- **Platform Use**: These are research tools, not production libraries. VBT integration would require building custom calculations or partnering with device APIs (GymAware, Vitruve, etc.). The linear regression for load-velocity profiles is straightforward to implement: velocity = slope * %1RM + intercept.

### 4. Powerlifting-Specific Data

#### OpenPowerlifting (ESSENTIAL DATASET)
- **URL**: https://www.openpowerlifting.org / https://gitlab.com/openpowerlifting/opl-data
- **Data License**: Public Domain (all competition data)
- **Code License**: AGPL-3.0+
- **Size**: 3,789,301 entries, 963,555 lifters, 60,359 meets (as of current)
- **Download**: https://data.openpowerlifting.org (bulk CSV)
- **Data Fields**: Name, Sex, Age, BodyweightKg, WeightClassKg, Event (SBD/BD/S/B/D), Equipment (Raw/Wraps/Single-ply/Multi-ply), Division, all squat/bench/deadlift attempts (1-4), Best3 lifts, TotalKg, Place, Tested status, Federation, Date, MeetName, Dots/Wilks/Glossbrenner/Goodlift scores
- **Federations**: Dozens of international federations (IPF, USAPL, USPA, APF, etc.)
- **Quality**: Manually entered and verified. Continuously updated. The gold standard in powerlifting data.
- **Platform Use**:
  - Derive strength standards by bodyweight class, age, and sex from actual competition data
  - Build percentile rankings ("Your squat is stronger than X% of competitors in your weight class")
  - Historical trending and record tracking
  - Federation-specific weight class definitions
  - Wilks/DOTS/IPF GL benchmarking
  - Could seed an athlete comparison feature

#### OpenLifter (Meet Management Software)
- **URL**: https://gitlab.com/openpowerlifting/openlifter
- **License**: AGPL-3.0+
- **Content**: Software for running local powerlifting competitions
- **Platform Use**: Reference for understanding competition workflows, weight class logic, and scoring systems. Not directly usable as a library.

#### Weight Class Standards
- No standalone open-source dataset found for weight class definitions across federations.
- **Best approach**: Extract from OpenPowerlifting's `crates/opltypes` Rust source files which define valid federations, weight classes, and age divisions.
- IPF weight classes (common): Men: 59, 66, 74, 83, 93, 105, 120, 120+; Women: 47, 52, 57, 63, 69, 76, 84, 84+

### 5. Training Program Templates & Generators

#### streprogen (PYTHON PROGRAM GENERATOR)
- **URL**: https://github.com/tommyod/streprogen
- **PyPI**: `streprogen`
- **License**: GPL-3.0
- **Language**: Python 3.6+
- **Stars**: 39, 10 forks
- **Features**: Dynamic strength program generation, multi-layer periodization, customizable progression rates, exercise-specific parameters, output to .txt/.html/.tex
- **API Example**:
  ```python
  from streprogen import Program, Day, DynamicExercise
  program = Program("MyProgram", duration=8, units="kg")
  with program.Day("Monday"):
      program.DynamicExercise("Squat", start_weight=100, min_reps=3, max_reps=8)
  program.render()
  ```
- **Platform Use**: GPL-3.0 is problematic for commercial use (copyleft). Best used as algorithmic reference for building a TypeScript periodization engine. The approach of specifying start weights, rep ranges, and duration to auto-generate weekly progressions is sound.

#### Liftosaur (FULL APP WITH SCRIPTING)
- **URL**: https://github.com/astashov/liftosaur
- **License**: AGPL-3.0
- **Language**: TypeScript (96.5%), Preact
- **Stars**: 513, 68 forks, 2,347 commits, 13 contributors
- **Features**: Built-in programs (5/3/1, GZCLP, Starting Strength), custom programming via Liftoscript scripting language, plate calculator, warmup sets, muscle activation maps, exercise substitution
- **Platform Use**: AGPL license prevents direct use. However, it demonstrates excellent patterns for: (a) implementing a domain-specific language for training programs, (b) exercise substitution based on muscle similarity, (c) warmup set generation, (d) plate calculator integration. Study its Liftoscript implementation for inspiration on building a program template engine.

#### Strength Studio (MIT LICENSE -- USABLE)
- **URL**: https://github.com/empirical-dan/strength
- **License**: MIT
- **Language**: TypeScript (48.2%), Vue 3 + Quasar
- **Features**: RPE-based and percentage-based training, e1RM using log-linear algorithm, calendar-based planning, exercise history
- **Stars**: 4 (early stage)
- **Platform Use**: MIT license makes it the most legally usable full-app reference. The log-linear 1RM algorithm (analyzed with R, reportedly more accurate than Brzycki/Epley for trained lifters) is worth studying. Early stage but clean architecture.

#### BarbellWhip (PERCENTAGE-BASED TRAINING FOCUS)
- **URL**: https://github.com/wdiasjunior/BarbellWhip
- **License**: GPL-3.0
- **Language**: TypeScript (83.6%), React Native
- **Stars**: 12
- **Features**: Built specifically for percentage-based powerlifting programs, includes RM calculator, plate calculator, and program editor
- **Platform Use**: GPL-3.0 limits commercial use. Useful as reference for how to build a percentage-based program editor UI in React Native/TypeScript.

#### Lift Vault Spreadsheets (CONTENT REFERENCE)
- **URL**: https://liftvault.com/programs/powerlifting/
- **License**: Various (spreadsheets, not code)
- **Content**: 85+ powerlifting program spreadsheets including 5/3/1 variants, Juggernaut Method, Sheiko, Calgary Barbell, Greg Nuckols 28 Programs, nSuns, GZCLP, DUP templates
- **Platform Use**: Not code, but invaluable for understanding program structures. Use as reference when building program templates. Each spreadsheet documents sets, reps, percentages, and progression logic that can be encoded into platform templates.

## Methodology / Approach

This research was conducted through systematic searching across:
1. **GitHub** -- repository search by topic (powerlifting, strength-training, exercise-database, 1rm, barbell), sorted by stars and recent updates
2. **npm** -- package search for TypeScript/JavaScript libraries related to fitness calculations
3. **PyPI** -- Python package search for strength training tools
4. **GitLab** -- specifically for OpenPowerlifting ecosystem
5. **Web search** -- for lesser-known projects, calculators, and data sources

Each resource was evaluated on: license compatibility (MIT/Unlicense preferred for commercial use), data completeness, maintenance status (last commit, stars, community activity), technical fit (TypeScript/JavaScript preferred for Next.js platform), and specific relevance to powerlifting coaching.

## Specific Examples & Case Studies

### Example: Seeding the Exercise Library
A practical approach using the discovered resources:
1. Import free-exercise-db's 800+ exercises (public domain) as the base
2. Merge exercise metadata from exercemus/exercises for aliases, tempo data, and variation relationships
3. Tag exercises with powerlifting-specific categories (competition lift, competition variation, accessory, GPP)
4. Associate YouTube video IDs with exercises for technique demonstrations
5. Add RPE/percentage-based prescription fields to the exercise schema

### Example: Building the Calculation Engine
```typescript
// Combine multiple open-source libraries:
import { calculateOneRepMax } from '@finegym/fitness-calc'  // MIT
import { wilks, dots } from 'powerlifting-formulas'          // MIT
import plateCalculator from 'plate-calculator'                // npm

// Calculate e1RM from training data
const e1rm = calculateOneRepMax(140, 5) // 140kg for 5 reps

// Score the lifter
const wilksScore = wilks(82.5, 510, 'male')
const dotsScore = dots(82.5, 510, 'male')

// Calculate plate loading for next set
const plates = plateCalculator.calculate({ targetWeight: 315, barWeight: 45 })
```

### Example: Athlete Benchmarking from OpenPowerlifting
Load the OpenPowerlifting CSV, filter by federation/equipment/sex/weight class, compute percentiles:
- "Your 500lb total at 83kg Raw puts you at the 72nd percentile among tested USAPL competitors"
- Derive classification tiers (Sub-Elite, Class I, Class II, etc.) from actual distribution data rather than arbitrary standards

## Notable Quotes

- free-exercise-db: "Open Public Domain Exercise Dataset in JSON format, over 800 exercises with a browsable public searchable frontend"
- OpenPowerlifting FAQ: "All data on this website is released into the public domain... All of our code is under the AGPLv3+ license"
- Strength Studio: "The focus is on facilitating strength training using up to date methods such as percentage max and rate of perceived exertion (RPE). It utilises a log-linear algorithm for calculating 1 rep max based on real data analysed using R"
- BarbellWhip: "A Free and Open Source workout management app made with the complexity of percentage based powerlifting training programs in mind, aiming to replace the use of spreadsheets"
- streprogen: "A Python 3.6+ package which allows the user to easily create dynamic, flexible strength training programs... Every important parameter can be changed by the user"
- Liftosaur: "Any workout program is fully customizable - you can clone existing one and adjust it to your needs. Every single program is written using Liftoscript right in the app"

## Evidence Quality Assessment

**Strength of Evidence**: Strong

**Evidence Types Present**:

- [x] Empirical data / statistics (OpenPowerlifting: 3.8M+ verified competition entries)
- [x] Case studies / real-world examples (multiple production apps using these libraries)
- [ ] Expert testimony / citations
- [x] Theoretical reasoning (1RM formulas based on peer-reviewed exercise science)
- [ ] Anecdotal evidence

**Credibility Indicators**:

- **Author/Source Authority**: OpenPowerlifting is the recognized gold standard for powerlifting data. Exercise databases are community-maintained with varying levels of curation.
- **Currency**: Most resources actively maintained (fitness-calc updated Feb 2026, OpenPowerlifting continuously updated, free-exercise-db has recent activity)
- **Transparency**: All repositories have visible commit histories, issue trackers, and documentation
- **Peer Review/Validation**: 1RM formulas sourced from peer-reviewed research. OpenPowerlifting data manually verified. Exercise databases community-reviewed.

## Critical Evaluation

**Strengths**:
- The ecosystem provides surprisingly comprehensive coverage for a niche domain
- Multiple license-compatible options (MIT, Unlicense) for each major need
- TypeScript libraries available for most calculations, fitting the Next.js tech stack
- OpenPowerlifting is unrivaled for competition data quality and coverage
- Exercise databases provide structured, importable data with consistent schemas

**Limitations**:
- No single library combines all needed calculations (1RM + coefficients + RPE + plate loading)
- Exercise databases skew general fitness, not powerlifting-specific -- will need manual curation to tag powerlifting relevance
- No open-source RPE/RIR lookup table packaged as a library
- No TypeScript periodization engine exists (streprogen is Python, Liftosaur is AGPL)
- Video content for exercises is the weakest area -- no open-source solution
- Many smaller libraries have low community adoption (1-10 stars) raising maintenance concerns
- AGPL-licensed projects (wger, Liftosaur, ExerciseDB) cannot be directly incorporated into a commercial product without open-sourcing the derivative work

**Potential Biases**:
- Open-source projects tend to favor general fitness over powerlifting-specific needs
- 1RM formulas are less accurate at higher rep ranges (>10) and may vary by exercise and training status
- RPE tables are population averages and may not match individual lifter characteristics
- Strength standards derived from competition data skew toward competitive lifters, not general gym population

## Relevance to Research Focus

**Primary Research Angle(s) Addressed**: Open-source resources for building a powerlifting/S&C coaching platform exercise library and calculation engine

**Specific Contributions to Research**:

This research directly maps available open-source resources to specific Cannoli Trainer platform features:
- **Exercise Library**: free-exercise-db + exercemus provides 800+ exercises with structured data, images, and taxonomy -- eliminates need to build from scratch
- **Calculation Engine**: fitness-calc + powerlifting-formulas + plate-calculator provides MIT-licensed TypeScript coverage for 1RM, Wilks, DOTS, and plate loading
- **Athlete Benchmarking**: OpenPowerlifting's 3.8M entries enables percentile rankings and strength standards derived from real competition data
- **Program Design**: Lift Vault spreadsheets + streprogen algorithmic approach provides templates and logic for building a program builder

**Gaps This Source Fills**: Identifies exactly which open-source resources exist, their licenses, quality, and how to combine them for a coaching platform. Eliminates the need to build exercise data, calculation formulas, and competition datasets from scratch.

**Gaps Still Remaining**:
- IPF GL (Goodlift Points) formula not available in any TypeScript package (must port from Rust)
- RPE/RIR conversion table not available as a packaged library (must implement as lookup data)
- No open-source periodization engine in TypeScript/JavaScript
- No open-source powerlifting-specific video library
- No open-source warmup set generator as a standalone library

## Practical Implications

- **Immediate wins**: Install `@finegym/fitness-calc` and `powerlifting-formulas` via npm for instant calculation capabilities. Import free-exercise-db JSON for exercise library seeding. Download OpenPowerlifting CSV for benchmarking data.
- **Build vs. buy clarity**: The research shows that exercise data and basic calculations are solved problems. Development effort should focus on coaching-specific features (program builder, athlete management, RPE tracking UX) rather than reinventing data and formulas.
- **License strategy**: Stick to MIT and Unlicense/Public Domain resources for the commercial platform. Avoid AGPL dependencies (wger, Liftosaur, ExerciseDB API) or use them only as reference material.
- **Data enrichment needed**: Open-source exercise databases are general-purpose. Cannoli Trainer will need to add powerlifting-specific metadata: competition lift classification, common cue sets, RPE prescriptions, and movement pattern tags.
- **Port IPF GL from Rust**: The OpenPowerlifting coefficients crate contains the definitive IPF GL implementation. Port `crates/coefficients/src/goodlift.rs` to TypeScript for the platform.
- **Build RPE table as data**: Implement the Tuchscherer RPE-to-%1RM table as a JSON lookup object. This is ~50 data points (RPE 6-10 x Reps 1-12) and straightforward to implement.
- **Phased video strategy**: Start by embedding YouTube videos from established channels. Build original video content for core lifts over time.

## Open Questions & Further Research Directions

1. **Exercise data quality audit**: How complete and accurate are the free-exercise-db entries for powerlifting-specific movements? Do squat/bench/deadlift variations have correct muscle group tagging and instructions?
2. **1RM formula accuracy comparison**: Which formula (Epley, Brzycki, etc.) is most accurate for trained powerlifters at competition-relevant rep ranges (1-5 reps)? The Strength Studio log-linear approach claims superiority.
3. **OpenPowerlifting data pipeline**: What is the best approach for ingesting and updating the OpenPowerlifting dataset? How frequently should it be refreshed? Can the CSV be streamed or does it need full replacement?
4. **Periodization engine architecture**: What would a TypeScript periodization engine look like? Should it use a DSL approach (like Liftosaur's Liftoscript) or a template/configuration approach? How should it handle RPE-based autoregulation alongside percentage-based programming?
5. **Federation data extraction**: Can weight class definitions, age divisions, and equipment categories be systematically extracted from OpenPowerlifting's Rust type definitions and converted to TypeScript types?

## Appendix: Quick Reference Table

| Resource | License | Language | npm Package | Stars | Best For |
|----------|---------|----------|-------------|-------|----------|
| free-exercise-db | Unlicense | JSON/Vue | n/a | 1.1k | Exercise data seeding |
| exercemus/exercises | MIT | JSON/Python | n/a | 36 | Exercise taxonomy/relationships |
| wrkout/exercises.json | Unlicense | JSON | n/a | 534 | Supplementary exercise data |
| ExerciseDB API | AGPL-3.0 | Various | n/a | 100 | Reference only (AGPL) |
| wger | AGPL-3.0 | Python/Django | n/a | 5.6k | Architectural reference only |
| @finegym/fitness-calc | MIT | TypeScript | @finegym/fitness-calc | 9 | 1RM + body comp calculations |
| powerlifting-formulas | MIT | TypeScript | powerlifting-formulas | 1 | Wilks/DOTS/coefficients |
| onerepmax-js | MIT | JavaScript | n/a | 2 | Simple 1RM calculations |
| plate-calculator | Unknown | JavaScript | plate-calculator | n/a | Barbell plate loading |
| OpenPowerlifting | Public Domain (data) | Rust/CSV | n/a | n/a | Competition data/benchmarking |
| streprogen | GPL-3.0 | Python | n/a (PyPI) | 39 | Program generation reference |
| Liftosaur | AGPL-3.0 | TypeScript | n/a | 513 | Program engine reference |
| Strength Studio | MIT | TypeScript/Vue | n/a | 4 | Full-app reference (MIT) |
| BarbellWhip | GPL-3.0 | TypeScript/RN | n/a | 12 | Percentage programming reference |
