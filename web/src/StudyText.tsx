import { memo } from 'react';
import { highlightStudyText } from './study-keywords';

// React text nodes preserve the original wording and escape source content.
const StudyText = memo(function StudyText({text,highlight=false}:{text:string;highlight?:boolean}) {
  if (!highlight) return <>{text}</>;
  return <>{highlightStudyText(text).map((part,index)=>part.kind
    ? <strong key={index} className={`study-keyword keyword-${part.kind}`}>{part.text}</strong>
    : part.text)}</>;
});
export default StudyText;
