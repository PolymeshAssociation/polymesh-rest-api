import { SetRequirementsDto } from '~/compliance/dto/set-requirements.dto';
import { IdentitiesService } from '~/identities/identities.service';

export async function lookupIdentities(
  dto: SetRequirementsDto,
  identitiesService: IdentitiesService
): Promise<void> {
  const lookups: any = [];
  dto.requirements.forEach(requirement => {
    requirement.forEach(async condition => {
      lookups.push(async () => {
        if (condition.did) {
          console.log('adding look up for ', condition.did);
          condition.identity = await identitiesService.findOne(condition.did);
        }
      });

      if (condition.claim && condition.claim.trustedClaimIssuers) {
        condition.claim.trustedClaimIssuers.forEach(async i => {
          lookups.push(async () => {
            if (i.did) {
              console.log('adding look up for ', condition.did);
              i.identity = await identitiesService.findOne(i.did);
            }
          });
        });
      }

      if (condition.claims) {
        condition.claims.forEach(async claim => {
          lookups.push(async () => {
            if (claim.trustedClaimIssuers) {
              claim.trustedClaimIssuers.forEach(async i => {
                console.log('adding look up for ', condition.did);
                i.identity = await identitiesService.findOne(i.did);
              });
            }
          });
        });
      }
    });
  });
  await Promise.all(lookups);
}
