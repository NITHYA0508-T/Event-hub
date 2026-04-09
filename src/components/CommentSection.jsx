import { useEffect, useState, useCallback } from "react";
import { commentsAPI } from "../api";
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../context/NotificationContext";
import { FiSend, FiCornerDownRight, FiAtSign } from "react-icons/fi";

export default function CommentSection({ eventId }) {
  const { user } = useAuth();
  const { fetchNotifications } = useNotifications();
  const [comments, setComments] = useState([]);
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [userSuggestions, setUserSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const fetchComments = useCallback(() => {
    try {
      setComments(commentsAPI.getByEvent(eventId));
    } catch {
      /* ignore */
    }
  }, [eventId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  // Parse @mentions from text
  const extractTags = (val) => {
    const matches = val.match(/@(\w+)/g);
    return matches ? matches.map((m) => m.slice(1)) : [];
  };

  // User search for @mention tagging
  const handleTextChange = (e) => {
    const val = e.target.value;
    setText(val);

    const atMatch = val.match(/@(\w*)$/);
    if (atMatch && atMatch[1].length >= 1) {
      const suggestions = commentsAPI.searchUsers(atMatch[1]);
      setUserSuggestions(suggestions);
      setShowSuggestions(suggestions.length > 0);
    } else {
      setShowSuggestions(false);
    }
  };

  const insertTag = (username) => {
    const newText = text.replace(/@(\w*)$/, `@${username} `);
    setText(newText);
    setShowSuggestions(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    try {
      commentsAPI.add(eventId, text.trim(), replyTo, extractTags(text), user._id);
      setText("");
      setReplyTo(null);
      fetchComments();
      fetchNotifications();
    } catch {
      /* ignore */
    }
  };

  // Build threaded structure
  const rootComments = comments.filter((c) => !c.parentComment);
  const getReplies = (parentId) =>
    comments.filter((c) => c.parentComment === parentId);

  return (
    <div className="comment-section">
      <h2>Discussion ({comments.length})</h2>

      {user ? (
        <form onSubmit={handleSubmit} className="comment-form">
          {replyTo && (
            <div className="reply-indicator">
              <FiCornerDownRight /> Replying to comment{" "}
              <button type="button" onClick={() => setReplyTo(null)}>
                Cancel
              </button>
            </div>
          )}
          <div className="comment-input-wrap">
            <textarea
              placeholder="Write a comment... Use @username to tag someone"
              value={text}
              onChange={handleTextChange}
              rows={3}
            />
            {showSuggestions && (
              <ul className="user-suggestions">
                {userSuggestions.map((u) => (
                  <li key={u._id} onClick={() => insertTag(u.username)}>
                    <FiAtSign /> {u.username}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <button type="submit" className="btn primary">
            <FiSend /> Post
          </button>
        </form>
      ) : (
        <p className="login-prompt">Login to join the discussion.</p>
      )}

      <div className="comments-list">
        {rootComments.map((comment) => (
          <CommentItem
            key={comment._id}
            comment={comment}
            getReplies={getReplies}
            onReply={setReplyTo}
            depth={0}
          />
        ))}
      </div>
    </div>
  );
}

function CommentItem({ comment, getReplies, onReply, depth }) {
  const replies = getReplies(comment._id);

  const renderText = (txt) => {
    return txt.split(/(@\w+)/g).map((part, i) =>
      part.startsWith("@") ? (
        <span key={i} className="mention">{part}</span>
      ) : (
        <span key={i}>{part}</span>
      )
    );
  };

  return (
    <div className="comment-item" style={{ marginLeft: depth * 24 }}>
      <div className="comment-header">
        <strong>{comment.author?.username}</strong>
        <span className="comment-time">
          {new Date(comment.createdAt).toLocaleString()}
        </span>
      </div>
      <div className="comment-body">{renderText(comment.text)}</div>
      {comment.taggedUsers?.length > 0 && (
        <div className="tagged-users">
          Tagged: {comment.taggedUsers.map((u) => `@${u.username}`).join(", ")}
        </div>
      )}
      <button className="reply-btn" onClick={() => onReply(comment._id)}>
        <FiCornerDownRight /> Reply
      </button>

      {replies.map((reply) => (
        <CommentItem
          key={reply._id}
          comment={reply}
          getReplies={getReplies}
          onReply={onReply}
          depth={depth + 1}
        />
      ))}
    </div>
  );
}
