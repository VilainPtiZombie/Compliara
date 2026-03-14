import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-declaration-preview',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (declaration()) {
    <div class="rgaa-decl">

      <!-- ── 1. Introduction ───────────────────────────────────────────────── -->
      <h1>Déclaration d'accessibilité</h1>

      <p>
        <strong>{{ declaration()!.service?.name }}</strong> s'engage à rendre
        @if (declaration()!.service?.url) {
          son site <a [href]="declaration()!.service.url" target="_blank" rel="noopener">{{ declaration()!.service.url }}</a>
        } @else { ses services numériques }
        accessible conformément à l'article 47 de la loi n°2005-102 du 11 février 2005.
      </p>

      <p>
        Cette déclaration d'accessibilité s'applique à
        <strong>{{ declaration()!.service?.name }}</strong>
        @if (declaration()!.service?.url) {
          (<a [href]="declaration()!.service.url" target="_blank" rel="noopener">{{ declaration()!.service.url }}</a>).
        }
      </p>

      <!-- ── 2. État de conformité ─────────────────────────────────────────── -->
      <h2 id="etat-conformite">État de conformité</h2>

      <p>
        <strong>{{ declaration()!.service?.name }}</strong>
        @if (declaration()!.service?.url) {
          (<a [href]="declaration()!.service.url" target="_blank" rel="noopener">{{ declaration()!.service.url }}</a>)
        }
        est <strong class="conformite-label {{ conformiteClass() }}">{{ conformiteLabel() }}</strong>
        avec le référentiel général d'amélioration de l'accessibilité (RGAA), version {{ declaration()!.rgaaVersion }}
        @if (nonConformes().length > 0 || derogations().length > 0) {
          en raison des non-conformités et des dérogations énumérées ci-dessous.
        }
      </p>

      <!-- ── 3. Résultats des tests ─────────────────────────────────────────── -->
      <h3 id="resultats-tests">Résultats des tests</h3>

      <p>
        @if (declaration()!.auditCompany) {
          L'audit de conformité réalisé par <strong>{{ declaration()!.auditCompany }}</strong> révèle que&nbsp;:
        } @else {
          L'audit de conformité révèle que&nbsp;:
        }
      </p>
      <ul>
        @if (declaration()!.complianceRate !== null) {
          <li>
            <strong>{{ declaration()!.complianceRate }}%</strong> des critères du RGAA version {{ declaration()!.rgaaVersion }} sont respectés&nbsp;;
          </li>
        }
        <li>
          Le taux moyen de conformité du site s'élève à
          <strong>{{ declaration()!.complianceRate !== null ? declaration()!.complianceRate + '%' : 'non calculé' }}</strong>.
        </li>
      </ul>

      <!-- ── 4. Contenus non accessibles ───────────────────────────────────── -->
      @if (nonConformes().length > 0 || derogations().length > 0) {
        <h2 id="contenus-non-accessibles">Contenus non accessibles</h2>

        @if (nonConformes().length > 0) {
          <h3 id="non-conformites">Non-conformités</h3>
          <ul>
            @for (cr of nonConformes(); track cr.criterionRef) {
              <li>
                <strong>Critère {{ cr.criterionRef }}</strong> — {{ cr.title }}
                @if (cr.impact) {
                  <span class="impact impact-{{ cr.impact | lowercase }}"> [{{ cr.impact }}]</span>
                }
                @if (cr.comment) {
                  <br><span class="detail">{{ cr.comment }}</span>
                }
              </li>
            }
          </ul>
        }

        @if (derogations().length > 0) {
          <h3 id="derogations">Dérogations pour charge disproportionnée</h3>
          <ul>
            @for (cr of derogations(); track cr.criterionRef) {
              <li>
                <strong>Critère {{ cr.criterionRef }}</strong> — {{ cr.title }}
                @if (cr.waiverReason) {
                  <br><span class="detail">{{ cr.waiverReason }}</span>
                }
              </li>
            }
          </ul>
        }
      }

      <!-- ── 5. Établissement de la déclaration ────────────────────────────── -->
      <h2 id="etablissement">Établissement de cette déclaration d'accessibilité</h2>

      <p>
        @if (declaration()!.dateAudit) {
          Cette déclaration a été établie le <strong>{{ declaration()!.dateAudit | date:'dd/MM/yyyy' }}</strong>.
        }
        @if (declaration()!.datePublication) {
          Elle a été mise à jour le <strong>{{ declaration()!.datePublication | date:'dd/MM/yyyy' }}</strong>.
        }
      </p>

      <!-- Technologies -->
      <h3 id="technologies">Technologies utilisées pour la réalisation du site</h3>
      @if (technologies().length > 0) {
        <ul>
          @for (tech of technologies(); track tech) {
            <li>{{ tech }}</li>
          }
        </ul>
      } @else {
        <p>Non renseigné.</p>
      }

      <!-- Environnement de test -->
      <h3 id="environnement">Environnement de test</h3>
      <p>
        Les vérifications de restitution de contenus ont été réalisées sur la base de la combinaison
        fournie par la base de référence du RGAA, avec les versions suivantes&nbsp;:
      </p>
      <ul>
        <li>Firefox et NVDA</li>
        <li>Safari et VoiceOver</li>
      </ul>

      <!-- Outils -->
      <h3 id="outils">Outils pour évaluer l'accessibilité</h3>
      @if (tools().length > 0) {
        <ul>
          @for (tool of tools(); track tool) {
            <li>{{ tool }}</li>
          }
        </ul>
      } @else {
        <p>Non renseigné.</p>
      }

      <!-- Pages auditées -->
      <h3 id="pages-auditees">Pages du site ayant fait l'objet de la vérification de conformité</h3>
      @if ((declaration()!.auditedPages ?? []).length > 0) {
        <ul>
          @for (p of declaration()!.auditedPages; track p.id) {
            <li>
              {{ p.name }}
              @if (p.url) {
                — <a [href]="p.url" target="_blank" rel="noopener">{{ p.url }}</a>
              }
            </li>
          }
        </ul>
      } @else {
        <p>Aucune page renseignée.</p>
      }

      <!-- ── 6. Retour d'information et contact ────────────────────────────── -->
      <h2 id="contact">Retour d'information et contact</h2>

      <p>
        Si vous n'arrivez pas à accéder à un contenu ou à un service, vous pouvez contacter
        le responsable de <strong>{{ declaration()!.service?.name }}</strong> pour être orienté
        vers une alternative accessible ou obtenir le contenu sous une autre forme.
      </p>
      <ul>
        @if (declaration()!.service?.contactEmail) {
          <li>
            Envoyer un message&nbsp;:
            <a [href]="'mailto:' + declaration()!.service.contactEmail">{{ declaration()!.service.contactEmail }}</a>
          </li>
        }
        @if (declaration()!.service?.contactName) {
          <li>Contacter <strong>{{ declaration()!.service.contactName }}</strong>
            @if (declaration()!.service?.contactPhone) {
              au {{ declaration()!.service.contactPhone }}
            }
          </li>
        }
        @if (!declaration()!.service?.contactEmail && !declaration()!.service?.contactName) {
          <li>Aucune information de contact renseignée.</li>
        }
      </ul>

      <!-- ── 7. Voies de recours ───────────────────────────────────────────── -->
      <h2 id="voies-recours">Voies de recours</h2>

      <p>
        Si vous constatez un défaut d'accessibilité vous empêchant d'accéder à un contenu ou une
        fonctionnalité du site, que vous nous le signalez et que vous ne parvenez pas à obtenir une
        réponse de notre part, vous êtes en droit de faire parvenir vos doléances ou une demande de
        saisine au Défenseur des droits.
      </p>
      <p>Plusieurs moyens sont à votre disposition&nbsp;:</p>
      <ul>
        <li>
          <a href="https://formulaire.defenseurdesdroits.fr/" target="_blank" rel="noopener external">
            Écrire un message au Défenseur des droits
          </a>
        </li>
        <li>Contacter le délégué du Défenseur des droits dans votre région</li>
        <li>
          Envoyer un courrier par la poste (gratuit, ne pas mettre de timbre)&nbsp;:<br>
          Défenseur des droits<br>
          Libre réponse 71120<br>
          75342 Paris CEDEX 07
        </li>
      </ul>

    </div>
    }
  `,
  styles: [`
    .rgaa-decl {
      font-family: Marianne, Arial, sans-serif;
      font-size: 1rem;
      line-height: 1.7;
      color: #1e1e1e;
      max-width: 800px;
    }

    h1 {
      font-size: 1.75rem;
      font-weight: 700;
      margin: 0 0 1.25rem;
      padding-bottom: 0.75rem;
      border-bottom: 3px solid #000091;
    }

    h2 {
      font-size: 1.25rem;
      font-weight: 700;
      margin: 2rem 0 0.75rem;
      padding-left: 0.75rem;
      border-left: 4px solid #000091;
    }

    h3 {
      font-size: 1rem;
      font-weight: 700;
      margin: 1.5rem 0 0.5rem;
      color: #3a3a3a;
    }

    p { margin: 0.5rem 0 1rem; }

    ul {
      margin: 0.25rem 0 1rem;
      padding-left: 1.5rem;
      li { margin-bottom: 0.4rem; }
    }

    a { color: #000091; }

    .conformite-label {
      padding: 0.15rem 0.5rem;
      border-radius: 4px;
      font-size: 0.95rem;
      &.conforme { background: #b8fec9; color: #1f6b3a; }
      &.partiellement { background: #feecc2; color: #7a4f00; }
      &.non-conforme { background: #fcd4d4; color: #7a0000; }
    }

    .detail {
      color: #6a6a6a;
      font-size: 0.9rem;
    }

    .impact {
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.1rem 0.35rem;
      border-radius: 3px;
      &.impact-critical { background: #fcd4d4; color: #7a0000; }
      &.impact-high     { background: #fde8cc; color: #7a3800; }
      &.impact-medium   { background: #feecc2; color: #7a4f00; }
      &.impact-low      { background: #e8e8e8; color: #3a3a3a; }
    }
  `],
})
export class DeclarationPreviewComponent {
  declaration = input<any>(null);

  conformiteLabel = computed(() => {
    const r = this.declaration()?.complianceRate;
    if (r == null) return 'non évaluée';
    if (r === 100) return 'totalement conforme';
    if (r >= 50) return 'partiellement conforme';
    return 'non conforme';
  });

  conformiteClass = computed(() => {
    const r = this.declaration()?.complianceRate;
    if (r == null) return '';
    if (r === 100) return 'conforme';
    if (r >= 50) return 'partiellement';
    return 'non-conforme';
  });

  nonConformes = computed(() =>
    (this.declaration()?.criterionResults ?? []).filter((cr: any) => cr.status === 'NON_CONFORME')
  );

  derogations = computed(() =>
    (this.declaration()?.criterionResults ?? []).filter((cr: any) => cr.hasWaiver)
  );

  technologies = computed(() => {
    const t = this.declaration()?.service?.technologies;
    return t ? t.split(',').map((s: string) => s.trim()).filter(Boolean) : [];
  });

  tools = computed(() => {
    const t = this.declaration()?.tools;
    return t ? t.split(',').map((s: string) => s.trim()).filter(Boolean) : [];
  });
}
