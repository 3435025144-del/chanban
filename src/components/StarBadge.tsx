import { useApp } from '../context/AppContext';
import Icon from './Icon';

interface Props {
  onClick?: () => void;
}

export default function StarBadge({ onClick }: Props) {
  const { state } = useApp();
  const content = (
    <>
      <Icon name="star" size={13} strokeWidth={2} />
      <span>{state.blindBox.stars} 星</span>
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="star-badge"
        aria-label={`当前 ${state.blindBox.stars} 星，查看攒星指南`}
      >
        {content}
      </button>
    );
  }

  return <span className="star-badge">{content}</span>;
}
