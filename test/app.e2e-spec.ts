import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { InstructionStatus } from '@polymeshassociation/polymesh-sdk/types';
import request from 'supertest';

import { AppModule } from '~/app.module';
import { PolymeshService } from '~/polymesh/polymesh.service';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let polymeshService: PolymeshService;

  beforeAll(async () => {
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      })
    );
    polymeshService = app.get(PolymeshService);
    await app.init();
  });

  afterAll(async () => {
    // This is to avoid jest sometimes tearing down too slowly and issuing a warning
    await new Promise(resolve => setTimeout(resolve, 5000));
    await Promise.all([app.close(), polymeshService.close()]);
  });

  describe('/tokens/:ticker (GET)', () => {
    describe('if the token exists', () => {
      it('should return token details', () => {
        return request(app.getHttpServer()).get('/tokens/JERE02').expect(HttpStatus.OK).expect({
          owner: '0x0600000000000000000000000000000000000000000000000000000000000000',
          assetType: 'EquityCommon',
          name: 'JERE01',
          totalSupply: '1000',
          pia: '0x0600000000000000000000000000000000000000000000000000000000000000',
          isDivisible: true,
        });
      });
    });
    describe('if the ticker is too long', () => {
      it('should return a Bad Request error', () => {
        return request(app.getHttpServer())
          .get('/tokens/JERE023465565435433566')
          .expect(HttpStatus.BAD_REQUEST)
          .expect({
            statusCode: 400,
            message: ['ticker must be shorter than or equal to 12 characters'],
            error: 'Bad Request',
          });
      });
    });
    describe('otherwise', () => {
      it('should return a Not Found error', () => {
        return request(app.getHttpServer())
          .get('/tokens/JERE9999')
          .expect(HttpStatus.NOT_FOUND)
          .expect({
            statusCode: HttpStatus.NOT_FOUND,
            message: 'There is no Security Token with ticker "JERE9999"',
            error: 'Not Found',
          });
      });
    });
  });

  describe('/identities/:did/tokens (GET)', () => {
    describe('if the did is not a 66 digit hex value', () => {
      it('should return a Bad Request error', () => {
        return request(app.getHttpServer())
          .get('/identities/zzz/tokens')
          .expect(HttpStatus.BAD_REQUEST)
          .expect({
            statusCode: 400,
            message: [
              'DID must be a hexadecimal number',
              'DID must start with "0x"',
              'DID must be 66 characters long',
            ],
            error: 'Bad Request',
          });
      });
    });
    describe('otherwise', () => {
      it("should return a list of the Identity's tokens", () => {
        return request(app.getHttpServer())
          .get(
            '/identities/0x0600000000000000000000000000000000000000000000000000000000000000/tokens'
          )
          .expect(HttpStatus.OK)
          .expect({
            results: [
              'JERE02',
              'CUCO',
              'JERE01',
              'VICTOR5',
              'JERE05',
              'VICTOR3',
              'FIDI',
              'TOPA',
              'JERE04',
              'B',
              'A',
              'ADAMTEST',
              'YHJ',
              'VICTOR6',
              'JERE03',
              'VICTOR2',
            ],
          });
      });
    });
  });

  describe('/identities/:did/pending-instructions (GET)', () => {
    describe('if the did is not a 66 digit hex value', () => {
      it('should return a Bad Request error', () => {
        return request(app.getHttpServer())
          .get('/identities/zzz/pending-instructions')
          .expect(HttpStatus.BAD_REQUEST)
          .expect({
            statusCode: 400,
            message: [
              'DID must be a hexadecimal number',
              'DID must start with "0x"',
              'DID must be 66 characters long',
            ],
            error: 'Bad Request',
          });
      });
    });
    describe('otherwise', () => {
      it("should return a list of the Identity's pending instructions", () => {
        return request(app.getHttpServer())
          .get(
            '/identities/0x0600000000000000000000000000000000000000000000000000000000000000/pending-instructions'
          )
          .expect(HttpStatus.OK)
          .expect({
            results: ['364', '912', '315', '577', '572', '275'],
          });
      });
    });
  });

  describe('/instructions/:id (GET)', () => {
    describe('if the instruction id is not a number string', () => {
      it('should return a Bad Request error', () => {
        return request(app.getHttpServer())
          .get('/instructions/zzz')
          .expect(HttpStatus.BAD_REQUEST)
          .expect({
            statusCode: 400,
            message: ['id must be a number string'],
            error: 'Bad Request',
          });
      });
    });
    describe('otherwise', () => {
      it("should return a pending Instruction's status", () => {
        return request(app.getHttpServer()).get('/instructions/10').expect(HttpStatus.OK).expect({
          status: InstructionStatus.Pending,
        });
      });

      it("should return an executed Instruction's status and event data", () => {
        return request(app.getHttpServer())
          .get('/instructions/911')
          .expect(HttpStatus.OK)
          .expect({
            status: InstructionStatus.Executed,
            eventIdentifier: {
              blockNumber: '2719172',
              blockDate: '2021-06-26T01:47:45.000Z',
              eventIndex: 1,
            },
          });
      });
    });
  });
});
