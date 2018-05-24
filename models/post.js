var postSchema = mongoose.Schema({
    title: String
    url: String
    votes: NumberInt
    initTimeAsTop: NumberInt
    finalTimeAsTop: NumberInt
});

var Post = mongoose.model('Post', postSchema);
