import mongoose from "mongoose";

const postSchema = mongoose.Schema(
    {
        userId: { type: String, required: true },
        desc: String,
        likes: [{ type: String }],
        image: String,
        comments: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Comments", 
            },
        ],
        shares: [{ type: String }],
        tags: [{ type: String }],
        category: {
            type: String,
            enum: ["Technology", "Fun", "Academics", "Projects", "Fashion","Travel", "Other"],
            default: "Other",
            required: true
        }
    },
    {
        timestamps: true,
    }
);

var PostModel = mongoose.model("Posts", postSchema);
export default PostModel;