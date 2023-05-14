const { bcrypt } = require("@bcrypt");
const { PrismaClient } = require("@prisma/client");
const { fakerEN_US } = require("@faker-js/faker");

enum Role {
  ADMIN = "ADMIN",
  AUTHOR = "AUTHOR",
}
const prisma = new PrismaClient();
const faker = fakerEN_US;

async function main() {
  try {
    const userCount = 20;
    const articleCount = 300;
    const categoryCount = 300;
    const commentCount = 500;

    const fakeUsers = generateFakeUsers(userCount);

    await prisma.$transaction([prisma.user.createMany({ data: fakeUsers })]);

    const lastUser = await prisma.user.findFirst({
      orderBy: {
        id: "desc",
      },
      select: {
        id: true,
      },
    });
    const lastAuthorId = lastUser ? lastUser.id : 1;
    const firstAuthorId = lastUser ? lastAuthorId - userCount + 1 : 1;

    const fakeArticles = generateFakeArticles(
      articleCount,
      firstAuthorId,
      lastAuthorId
    );

    await prisma.$transaction([
      prisma.article.createMany({ data: fakeArticles }),
    ]);

    const lastArticle = await prisma.article.findFirst({
      orderBy: {
        id: "desc",
      },
      select: {
        id: true,
      },
    });
    const lastArticleId = lastArticle ? lastArticle.id : 1;
    const firstArticleId = lastArticle ? lastArticleId - articleCount + 1 : 1;

    const fakeCategories = generateFakeCategories(
      categoryCount,
      firstAuthorId,
      lastAuthorId
    );

    const fakeComments = generateFakeComments(
      commentCount,
      firstAuthorId,
      lastAuthorId,
      firstArticleId,
      lastArticleId
    );

    await prisma.$transaction([
      prisma.category.createMany({ data: fakeCategories }),
      prisma.comment.createMany({ data: fakeComments }),
    ]);

    console.log(
      `Added ${userCount} users, ${articleCount} articles, ${categoryCount} categories, and ${commentCount} comments.`
    );
  } catch (e) {
    console.error(e);
    await prisma.$disconnect();
  } finally {
    await prisma.$disconnect();
  }
}
main();

function generateFakeUsers(count: number) {
  return [...Array(count)].map(() => {
    const password = bcrypt.hash(faker.internet.password(), 10);
    return {
      name: faker.person.fullName(),
      email: faker.internet.email(),
      password,
      role: Role.AUTHOR,
    };
  });
}

function generateFakeArticles(
  count: number,
  minAuthorId: number,
  maxAuthorId: number
) {
  return [...Array(count)].map(() => {
    const title = faker.lorem.sentence();
    const content = faker.lorem.paragraphs();
    return {
      title: title.charAt(0).toUpperCase() + title.slice(1),
      content: content.charAt(0).toUpperCase() + content.slice(1),
      isPublished: true,
      authorId: faker.number.int({ min: minAuthorId, max: maxAuthorId }),
      image: faker.image.url(),
    };
  });
}

function generateFakeCategories(
  count: number,
  minAuthorId: number,
  maxAuthorId: number
) {
  return [...Array(count)].map(() => {
    const name = faker.word.noun();
    return {
      name: name.charAt(0).toUpperCase() + name.slice(1),
      authorId: faker.number.int({ min: minAuthorId, max: maxAuthorId }),
    };
  });
}

function generateFakeComments(
  count: number,
  minAuthorId: number,
  maxAuthorId: number,
  minArticleId: number,
  maxArticleId: number
) {
  return [...Array(count)].map(() => {
    const content = faker.lorem.paragraph();
    return {
      content: content.charAt(0).toUpperCase() + content.slice(1),
      authorId: faker.number.int({ min: minAuthorId, max: maxAuthorId }),
      articleId: faker.number.int({ min: minArticleId, max: maxArticleId }),
    };
  });
}