type Pagedata = {
  title: string;
};
const PageMeta = ({ title }: Pagedata) => {
  return (
    <title>
      {title
        ? `${title} | Amanah Assets - Asset Management System for Amanah insurance`
        : ' Amanah Assets - Asset Management System for Amanah insurance'}
    </title>
  );
};

export default PageMeta;
