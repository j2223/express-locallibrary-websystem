const Author = require("../models/author");
const Book = require("../models/book");

const { body, validationResult } = require("express-validator");
const asyncHandler = require("express-async-handler");

// すべての著者のリストを表示
exports.author_list = asyncHandler(async (req, res, next) => {
  const allAuthors = await Author.find().sort({ family_name: 1 }).exec();
  res.render("author_list", {
    title: "著者一覧",
    author_list: allAuthors,
  });
});

// 特定の著者の詳細ページを表示
exports.author_detail = asyncHandler(async (req, res, next) => {
  // 著者の詳細とその著者のすべての本を（並列で）取得
  const [author, allBooksByAuthor] = await Promise.all([
    Author.findById(req.params.id).exec(),
    Book.find({ author: req.params.id }, "title summary").exec(),
  ]);

  if (author === null) {
    // 結果なし
    const err = new Error("Author not found");
    err.status = 404;
    return next(err);
  }

  res.render("author_detail", {
    title: "著者詳細",
    author: author,
    author_books: allBooksByAuthor,
  });
});

// 著者作成フォーム（GET）を表示
exports.author_create_get = (req, res, next) => {
  res.render("author_form", { title: "Create Author" });
};

// 著者作成処理（POST）
exports.author_create_post = [
  // フィールドのバリデーションとサニタイズ
  body("first_name")
    .trim()
    .isLength({ min: 1 })
    .escape()
    .withMessage("First name must be specified.")
    .isAlphanumeric()
    .withMessage("First name has non-alphanumeric characters."),
  body("family_name")
    .trim()
    .isLength({ min: 1 })
    .escape()
    .withMessage("Family name must be specified.")
    .isAlphanumeric()
    .withMessage("Family name has non-alphanumeric characters."),
  body("date_of_birth", "Invalid date of birth")
    .optional({ values: "falsy" })
    .isISO8601()
    .toDate(),
  body("date_of_death", "Invalid date of death")
    .optional({ values: "falsy" })
    .isISO8601()
    .toDate(),

  // バリデーションとサニタイズ後のリクエスト処理
  asyncHandler(async (req, res, next) => {
    // バリデーションエラーを抽出
    const errors = validationResult(req);

    // エスケープ・トリム済みデータで著者オブジェクトを作成
    const author = new Author({
      first_name: req.body.first_name,
      family_name: req.body.family_name,
      date_of_birth: req.body.date_of_birth,
      date_of_death: req.body.date_of_death,
    });

    if (!errors.isEmpty()) {
      // エラーあり。フォームを再表示
      res.render("author_form", {
        title: "著作者追加",
        author: author,
        errors: errors.array(),
      });
      return;
    } else {
      // フォームデータは有効

      // 著者を保存
      await author.save();
      // 新しい著者レコードにリダイレクト
      res.redirect(author.url);
    }
  }),
];

// 著者削除フォーム（GET）を表示
exports.author_delete_get = asyncHandler(async (req, res, next) => {
  // 著者の詳細とその著者のすべての本を（並列で）取得
  const [author, allBooksByAuthor] = await Promise.all([
    Author.findById(req.params.id).exec(),
    Book.find({ author: req.params.id }, "title summary").exec(),
  ]);

  if (author === null) {
    // 結果なし
    res.redirect("/catalog/authors");
  }

  res.render("author_delete", {
    title: "著作者削除",
    author: author,
    author_books: allBooksByAuthor,
  });
});

// 著者削除処理（POST）
exports.author_delete_post = asyncHandler(async (req, res, next) => {
  // 著者の詳細とその著者のすべての本を（並列で）取得
  const [author, allBooksByAuthor] = await Promise.all([
    Author.findById(req.params.id).exec(),
    Book.find({ author: req.params.id }, "title summary").exec(),
  ]);

  if (allBooksByAuthor.length > 0) {
    // 著者に本がある場合。GETルートと同じように表示
    res.render("author_delete", {
      title: "Delete Author著作者削除",
      author: author,
      author_books: allBooksByAuthor,
    });
    return;
  } else {
    // 著者に本がない場合。オブジェクトを削除し、著者リストにリダイレクト
    await Author.findByIdAndDelete(req.body.authorid);
    res.redirect("/catalog/authors");
  }
});

// 著者更新フォーム（GET）を表示
exports.author_update_get = asyncHandler(async (req, res, next) => {
  const author = await Author.findById(req.params.id).exec();
  if (author === null) {
    // 結果なし
    const err = new Error("Author not found");
    err.status = 404;
    return next(err);
  }

  res.render("author_form", { title: "Update Author", author: author });
});

// 著者更新処理（POST）
exports.author_update_post = [
  // フィールドのバリデーションとサニタイズ
  body("first_name")
    .trim()
    .isLength({ min: 1 })
    .escape()
    .withMessage("First name must be specified.")
    .isAlphanumeric()
    .withMessage("First name has non-alphanumeric characters."),
  body("family_name")
    .trim()
    .isLength({ min: 1 })
    .escape()
    .withMessage("Family name must be specified.")
    .isAlphanumeric()
    .withMessage("Family name has non-alphanumeric characters."),
  body("date_of_birth", "Invalid date of birth")
    .optional({ values: "falsy" })
    .isISO8601()
    .toDate(),
  body("date_of_death", "Invalid date of death")
    .optional({ values: "falsy" })
    .isISO8601()
    .toDate(),

  // バリデーションとサニタイズ後のリクエスト処理
  asyncHandler(async (req, res, next) => {
    // バリデーションエラーを抽出
    const errors = validationResult(req);

    // エスケープ・トリム済みデータで著者オブジェクトを作成（古いIDも含む）
    const author = new Author({
      first_name: req.body.first_name,
      family_name: req.body.family_name,
      date_of_birth: req.body.date_of_birth,
      date_of_death: req.body.date_of_death,
      _id: req.params.id,
    });

    if (!errors.isEmpty()) {
      // エラーあり。フォームを再表示
      res.render("author_form", {
        title: "著作者更新",
        author: author,
        errors: errors.array(),
      });
      return;
    } else {
      // フォームデータは有効。レコードを更新
      await Author.findByIdAndUpdate(req.params.id, author);
      res.redirect(author.url);
    }
  }),
];
